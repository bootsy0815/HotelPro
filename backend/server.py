from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import resend
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend API setup
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class RoomType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    base_price: float
    max_guests: int
    amenities: List[str] = []
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Room(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_number: str
    room_type_id: str
    floor: int
    status: str = "available"  # available, occupied, cleaning, maintenance
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Guest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    id_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    guest_id: str
    room_id: str
    check_in: datetime
    check_out: datetime
    num_guests: int
    total_price: float
    status: str = "confirmed"  # confirmed, checked_in, checked_out, cancelled
    special_requests: Optional[str] = None
    booking_source: str = "direct"  # direct, booking_com, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    guest_id: str
    amount: float
    tax: float
    total: float
    status: str = "pending"  # pending, paid, cancelled
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    issued_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None

# ============== HELPER FUNCTIONS ==============

async def send_email_async(to_email: str, subject: str, html_content: str):
    """Send email using Resend API"""
    if not RESEND_API_KEY:
        logging.warning("Resend API key not configured. Email not sent.")
        return {"status": "skipped", "message": "Email not configured"}
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "success", "email_id": email.get("id")}
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        return {"status": "error", "message": str(e)}

# ============== ROOM TYPES ENDPOINTS ==============

@api_router.post("/room-types", response_model=RoomType)
async def create_room_type(room_type: RoomType):
    doc = room_type.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.room_types.insert_one(doc)
    return room_type

@api_router.get("/room-types", response_model=List[RoomType])
async def get_room_types():
    room_types = await db.room_types.find({}, {"_id": 0}).to_list(1000)
    for rt in room_types:
        if isinstance(rt['created_at'], str):
            rt['created_at'] = datetime.fromisoformat(rt['created_at'])
    return room_types

@api_router.get("/room-types/{room_type_id}", response_model=RoomType)
async def get_room_type(room_type_id: str):
    room_type = await db.room_types.find_one({"id": room_type_id}, {"_id": 0})
    if not room_type:
        raise HTTPException(status_code=404, detail="Room type not found")
    if isinstance(room_type['created_at'], str):
        room_type['created_at'] = datetime.fromisoformat(room_type['created_at'])
    return room_type

@api_router.delete("/room-types/{room_type_id}")
async def delete_room_type(room_type_id: str):
    result = await db.room_types.delete_one({"id": room_type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Room type not found")
    return {"message": "Room type deleted successfully"}

# ============== ROOMS ENDPOINTS ==============

@api_router.post("/rooms", response_model=Room)
async def create_room(room: Room):
    doc = room.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.rooms.insert_one(doc)
    return room

@api_router.get("/rooms", response_model=List[Room])
async def get_rooms():
    rooms = await db.rooms.find({}, {"_id": 0}).to_list(1000)
    for room in rooms:
        if isinstance(room['created_at'], str):
            room['created_at'] = datetime.fromisoformat(room['created_at'])
    return rooms

@api_router.get("/rooms/{room_id}", response_model=Room)
async def get_room(room_id: str):
    room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if isinstance(room['created_at'], str):
        room['created_at'] = datetime.fromisoformat(room['created_at'])
    return room

@api_router.patch("/rooms/{room_id}/status")
async def update_room_status(room_id: str, status: str):
    result = await db.rooms.update_one(
        {"id": room_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room status updated"}

@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    result = await db.rooms.delete_one({"id": room_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room deleted successfully"}

# ============== GUESTS ENDPOINTS ==============

@api_router.post("/guests", response_model=Guest)
async def create_guest(guest: Guest):
    doc = guest.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.guests.insert_one(doc)
    return guest

@api_router.get("/guests", response_model=List[Guest])
async def get_guests():
    guests = await db.guests.find({}, {"_id": 0}).to_list(1000)
    for guest in guests:
        if isinstance(guest['created_at'], str):
            guest['created_at'] = datetime.fromisoformat(guest['created_at'])
    return guests

@api_router.get("/guests/{guest_id}", response_model=Guest)
async def get_guest(guest_id: str):
    guest = await db.guests.find_one({"id": guest_id}, {"_id": 0})
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    if isinstance(guest['created_at'], str):
        guest['created_at'] = datetime.fromisoformat(guest['created_at'])
    return guest

@api_router.put("/guests/{guest_id}", response_model=Guest)
async def update_guest(guest_id: str, guest: Guest):
    guest.id = guest_id
    doc = guest.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    result = await db.guests.update_one(
        {"id": guest_id},
        {"$set": doc}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Guest not found")
    return guest

@api_router.delete("/guests/{guest_id}")
async def delete_guest(guest_id: str):
    result = await db.guests.delete_one({"id": guest_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Guest not found")
    return {"message": "Guest deleted successfully"}

# ============== BOOKINGS ENDPOINTS ==============

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: Booking, background_tasks: BackgroundTasks):
    # Check room availability
    room = await db.rooms.find_one({"id": booking.room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check for overlapping bookings
    overlapping = await db.bookings.find_one({
        "room_id": booking.room_id,
        "status": {"$nin": ["cancelled", "checked_out"]},
        "$or": [
            {"check_in": {"$lte": booking.check_out.isoformat()}, "check_out": {"$gte": booking.check_in.isoformat()}}
        ]
    })
    
    if overlapping:
        raise HTTPException(status_code=400, detail="Room not available for selected dates")
    
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['check_in'] = doc['check_in'].isoformat()
    doc['check_out'] = doc['check_out'].isoformat()
    await db.bookings.insert_one(doc)
    
    # Send confirmation email
    guest = await db.guests.find_one({"id": booking.guest_id}, {"_id": 0})
    if guest and RESEND_API_KEY:
        html_content = f"""
        <h2>Buchungsbestätigung</h2>
        <p>Liebe/r {guest['first_name']} {guest['last_name']},</p>
        <p>Ihre Buchung wurde bestätigt!</p>
        <ul>
            <li>Buchungs-ID: {booking.id}</li>
            <li>Check-in: {booking.check_in.strftime('%d.%m.%Y')}</li>
            <li>Check-out: {booking.check_out.strftime('%d.%m.%Y')}</li>
            <li>Gesamtpreis: €{booking.total_price:.2f}</li>
        </ul>
        <p>Wir freuen uns auf Ihren Besuch!</p>
        """
        background_tasks.add_task(send_email_async, guest['email'], "Buchungsbestätigung", html_content)
    
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    for booking in bookings:
        if isinstance(booking['created_at'], str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        if isinstance(booking['check_in'], str):
            booking['check_in'] = datetime.fromisoformat(booking['check_in'])
        if isinstance(booking['check_out'], str):
            booking['check_out'] = datetime.fromisoformat(booking['check_out'])
    return bookings

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if isinstance(booking['created_at'], str):
        booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    if isinstance(booking['check_in'], str):
        booking['check_in'] = datetime.fromisoformat(booking['check_in'])
    if isinstance(booking['check_out'], str):
        booking['check_out'] = datetime.fromisoformat(booking['check_out'])
    return booking

@api_router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str):
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update room status based on booking status
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if booking:
        if status == "checked_in":
            await db.rooms.update_one({"id": booking['room_id']}, {"$set": {"status": "occupied"}})
        elif status == "checked_out":
            await db.rooms.update_one({"id": booking['room_id']}, {"$set": {"status": "cleaning"}})
    
    return {"message": "Booking status updated"}

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str):
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking deleted successfully"}

# ============== INVOICES ENDPOINTS ==============

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice: Invoice, background_tasks: BackgroundTasks):
    doc = invoice.model_dump()
    doc['issued_at'] = doc['issued_at'].isoformat()
    if doc['paid_at']:
        doc['paid_at'] = doc['paid_at'].isoformat()
    await db.invoices.insert_one(doc)
    
    # Send invoice email
    guest = await db.guests.find_one({"id": invoice.guest_id}, {"_id": 0})
    if guest and RESEND_API_KEY:
        html_content = f"""
        <h2>Rechnung</h2>
        <p>Liebe/r {guest['first_name']} {guest['last_name']},</p>
        <p>Anbei Ihre Rechnung:</p>
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td>Rechnungsnummer:</td><td>{invoice.id}</td></tr>
            <tr><td>Betrag:</td><td>€{invoice.amount:.2f}</td></tr>
            <tr><td>Steuer:</td><td>€{invoice.tax:.2f}</td></tr>
            <tr><td><strong>Gesamt:</strong></td><td><strong>€{invoice.total:.2f}</strong></td></tr>
        </table>
        <p>Vielen Dank für Ihren Aufenthalt!</p>
        """
        background_tasks.add_task(send_email_async, guest['email'], "Rechnung", html_content)
    
    return invoice

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    for invoice in invoices:
        if isinstance(invoice['issued_at'], str):
            invoice['issued_at'] = datetime.fromisoformat(invoice['issued_at'])
        if invoice.get('paid_at') and isinstance(invoice['paid_at'], str):
            invoice['paid_at'] = datetime.fromisoformat(invoice['paid_at'])
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if isinstance(invoice['issued_at'], str):
        invoice['issued_at'] = datetime.fromisoformat(invoice['issued_at'])
    if invoice.get('paid_at') and isinstance(invoice['paid_at'], str):
        invoice['paid_at'] = datetime.fromisoformat(invoice['paid_at'])
    return invoice

@api_router.patch("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: str, payment_method: Optional[str] = None):
    update_data = {"status": status}
    if status == "paid":
        update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
        if payment_method:
            update_data["payment_method"] = payment_method
    
    result = await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice status updated"}

# ============== STATISTICS ENDPOINTS ==============

@api_router.get("/statistics/dashboard")
async def get_dashboard_statistics():
    today = datetime.now(timezone.utc)
    today_str = today.strftime("%Y-%m-%d")
    
    # Total rooms
    total_rooms = await db.rooms.count_documents({})
    
    # Available rooms
    available_rooms = await db.rooms.count_documents({"status": "available"})
    
    # Occupied rooms
    occupied_rooms = await db.rooms.count_documents({"status": "occupied"})
    
    # Today's check-ins
    todays_checkins = await db.bookings.count_documents({
        "check_in": {"$gte": today_str, "$lt": (today + timedelta(days=1)).strftime("%Y-%m-%d")}
    })
    
    # Today's check-outs
    todays_checkouts = await db.bookings.count_documents({
        "check_out": {"$gte": today_str, "$lt": (today + timedelta(days=1)).strftime("%Y-%m-%d")}
    })
    
    # Total bookings this month
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_bookings = await db.bookings.count_documents({
        "created_at": {"$gte": month_start.isoformat()}
    })
    
    # Total revenue this month
    revenue_pipeline = [
        {"$match": {"issued_at": {"$gte": month_start.isoformat()}, "status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.invoices.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    # Occupancy rate
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    return {
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "occupied_rooms": occupied_rooms,
        "todays_checkins": todays_checkins,
        "todays_checkouts": todays_checkouts,
        "month_bookings": month_bookings,
        "month_revenue": total_revenue,
        "occupancy_rate": round(occupancy_rate, 2)
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()