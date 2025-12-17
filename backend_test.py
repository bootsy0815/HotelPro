#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class HotelAPITester:
    def __init__(self, base_url="https://windotel.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.created_room_type_id = None
        self.created_room_id = None
        self.created_guest_id = None
        self.created_booking_id = None
        self.created_invoice_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                if response.text:
                    details += f" Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_dashboard_statistics(self):
        """Test dashboard statistics endpoint"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "statistics/dashboard",
            200
        )
        
        if success:
            required_fields = ['total_rooms', 'available_rooms', 'occupied_rooms', 
                             'todays_checkins', 'todays_checkouts', 'month_bookings', 
                             'month_revenue', 'occupancy_rate']
            
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log_test("Dashboard Statistics - Fields Check", False, 
                            f"Missing fields: {missing_fields}")
            else:
                self.log_test("Dashboard Statistics - Fields Check", True)
        
        return success

    def test_room_types_crud(self):
        """Test room types CRUD operations"""
        # Create room type
        room_type_data = {
            "name": "Standard Zimmer",
            "description": "Komfortables Standardzimmer mit Balkon",
            "base_price": 89.99,
            "max_guests": 2,
            "amenities": ["WLAN", "TV", "Balkon"]
        }
        
        success, response = self.run_test(
            "Create Room Type",
            "POST",
            "room-types",
            200,
            data=room_type_data
        )
        
        if success and 'id' in response:
            self.created_room_type_id = response['id']
            
            # Get room types
            self.run_test("Get Room Types", "GET", "room-types", 200)
            
            # Get specific room type
            self.run_test(
                "Get Specific Room Type",
                "GET",
                f"room-types/{self.created_room_type_id}",
                200
            )
            
            # Delete room type (cleanup)
            self.run_test(
                "Delete Room Type",
                "DELETE",
                f"room-types/{self.created_room_type_id}",
                200
            )
        
        return success

    def test_rooms_crud(self):
        """Test rooms CRUD operations"""
        # First create a room type for the room
        room_type_data = {
            "name": "Test Room Type",
            "description": "Test room type for testing",
            "base_price": 100.0,
            "max_guests": 2,
            "amenities": ["WLAN"]
        }
        
        success, rt_response = self.run_test(
            "Create Room Type for Room Test",
            "POST",
            "room-types",
            200,
            data=room_type_data
        )
        
        if not success:
            return False
            
        room_type_id = rt_response['id']
        
        # Create room
        room_data = {
            "room_number": "101",
            "room_type_id": room_type_id,
            "floor": 1,
            "status": "available",
            "notes": "Test room"
        }
        
        success, response = self.run_test(
            "Create Room",
            "POST",
            "rooms",
            200,
            data=room_data
        )
        
        if success and 'id' in response:
            self.created_room_id = response['id']
            
            # Get rooms
            self.run_test("Get Rooms", "GET", "rooms", 200)
            
            # Get specific room
            self.run_test(
                "Get Specific Room",
                "GET",
                f"rooms/{self.created_room_id}",
                200
            )
            
            # Update room status
            self.run_test(
                "Update Room Status",
                "PATCH",
                f"rooms/{self.created_room_id}/status",
                200,
                params={"status": "occupied"}
            )
            
            # Delete room (cleanup)
            self.run_test(
                "Delete Room",
                "DELETE",
                f"rooms/{self.created_room_id}",
                200
            )
        
        # Cleanup room type
        self.run_test(
            "Delete Room Type (cleanup)",
            "DELETE",
            f"room-types/{room_type_id}",
            200
        )
        
        return success

    def test_guests_crud(self):
        """Test guests CRUD operations"""
        # Create guest
        guest_data = {
            "first_name": "Max",
            "last_name": "Mustermann",
            "email": "max.mustermann@example.com",
            "phone": "+49 123 456789",
            "address": "Musterstraße 123, 12345 Musterstadt",
            "id_number": "DE123456789",
            "notes": "Test guest"
        }
        
        success, response = self.run_test(
            "Create Guest",
            "POST",
            "guests",
            200,
            data=guest_data
        )
        
        if success and 'id' in response:
            self.created_guest_id = response['id']
            
            # Get guests
            self.run_test("Get Guests", "GET", "guests", 200)
            
            # Get specific guest
            self.run_test(
                "Get Specific Guest",
                "GET",
                f"guests/{self.created_guest_id}",
                200
            )
            
            # Update guest
            updated_guest_data = guest_data.copy()
            updated_guest_data['notes'] = "Updated test guest"
            
            self.run_test(
                "Update Guest",
                "PUT",
                f"guests/{self.created_guest_id}",
                200,
                data=updated_guest_data
            )
            
            # Delete guest (cleanup)
            self.run_test(
                "Delete Guest",
                "DELETE",
                f"guests/{self.created_guest_id}",
                200
            )
        
        return success

    def test_bookings_crud(self):
        """Test bookings CRUD operations"""
        # First create dependencies (room type, room, guest)
        room_type_data = {
            "name": "Booking Test Room Type",
            "description": "Test room type for booking test",
            "base_price": 120.0,
            "max_guests": 2,
            "amenities": ["WLAN", "TV"]
        }
        
        success, rt_response = self.run_test(
            "Create Room Type for Booking Test",
            "POST",
            "room-types",
            200,
            data=room_type_data
        )
        
        if not success:
            return False
            
        room_type_id = rt_response['id']
        
        room_data = {
            "room_number": "201",
            "room_type_id": room_type_id,
            "floor": 2,
            "status": "available"
        }
        
        success, room_response = self.run_test(
            "Create Room for Booking Test",
            "POST",
            "rooms",
            200,
            data=room_data
        )
        
        if not success:
            return False
            
        room_id = room_response['id']
        
        guest_data = {
            "first_name": "Anna",
            "last_name": "Schmidt",
            "email": "anna.schmidt@example.com",
            "phone": "+49 987 654321"
        }
        
        success, guest_response = self.run_test(
            "Create Guest for Booking Test",
            "POST",
            "guests",
            200,
            data=guest_data
        )
        
        if not success:
            return False
            
        guest_id = guest_response['id']
        
        # Create booking
        tomorrow = datetime.now() + timedelta(days=1)
        day_after = datetime.now() + timedelta(days=3)
        
        booking_data = {
            "guest_id": guest_id,
            "room_id": room_id,
            "check_in": tomorrow.isoformat(),
            "check_out": day_after.isoformat(),
            "num_guests": 2,
            "total_price": 240.0,
            "status": "confirmed",
            "special_requests": "Late check-in"
        }
        
        success, response = self.run_test(
            "Create Booking",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        
        if success and 'id' in response:
            self.created_booking_id = response['id']
            
            # Get bookings
            self.run_test("Get Bookings", "GET", "bookings", 200)
            
            # Get specific booking
            self.run_test(
                "Get Specific Booking",
                "GET",
                f"bookings/{self.created_booking_id}",
                200
            )
            
            # Update booking status
            self.run_test(
                "Update Booking Status",
                "PATCH",
                f"bookings/{self.created_booking_id}/status",
                200,
                params={"status": "checked_in"}
            )
            
            # Delete booking (cleanup)
            self.run_test(
                "Delete Booking",
                "DELETE",
                f"bookings/{self.created_booking_id}",
                200
            )
        
        # Cleanup dependencies
        self.run_test("Delete Guest (cleanup)", "DELETE", f"guests/{guest_id}", 200)
        self.run_test("Delete Room (cleanup)", "DELETE", f"rooms/{room_id}", 200)
        self.run_test("Delete Room Type (cleanup)", "DELETE", f"room-types/{room_type_id}", 200)
        
        return success

    def test_invoices_crud(self):
        """Test invoices CRUD operations"""
        # Create dependencies first
        guest_data = {
            "first_name": "Invoice",
            "last_name": "Test",
            "email": "invoice.test@example.com",
            "phone": "+49 111 222333"
        }
        
        success, guest_response = self.run_test(
            "Create Guest for Invoice Test",
            "POST",
            "guests",
            200,
            data=guest_data
        )
        
        if not success:
            return False
            
        guest_id = guest_response['id']
        booking_id = str(uuid.uuid4())  # Mock booking ID
        
        # Create invoice
        invoice_data = {
            "booking_id": booking_id,
            "guest_id": guest_id,
            "amount": 200.0,
            "tax": 38.0,
            "total": 238.0,
            "status": "pending",
            "notes": "Test invoice"
        }
        
        success, response = self.run_test(
            "Create Invoice",
            "POST",
            "invoices",
            200,
            data=invoice_data
        )
        
        if success and 'id' in response:
            self.created_invoice_id = response['id']
            
            # Get invoices
            self.run_test("Get Invoices", "GET", "invoices", 200)
            
            # Get specific invoice
            self.run_test(
                "Get Specific Invoice",
                "GET",
                f"invoices/{self.created_invoice_id}",
                200
            )
            
            # Update invoice status
            self.run_test(
                "Update Invoice Status",
                "PATCH",
                f"invoices/{self.created_invoice_id}/status",
                200,
                params={"status": "paid", "payment_method": "Barzahlung"}
            )
        
        # Cleanup
        self.run_test("Delete Guest (cleanup)", "DELETE", f"guests/{guest_id}", 200)
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Hotel Management API Tests")
        print("=" * 50)
        
        # Test dashboard statistics
        self.test_dashboard_statistics()
        
        # Test CRUD operations
        self.test_room_types_crud()
        self.test_rooms_crud()
        self.test_guests_crud()
        self.test_bookings_crud()
        self.test_invoices_crud()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = HotelAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())