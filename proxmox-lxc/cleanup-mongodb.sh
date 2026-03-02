#!/bin/bash

# Cleanup Script - Alte MongoDB Repositories entfernen

echo "=========================================="
echo "MongoDB Cleanup - Alte Repositories entfernen"
echo "=========================================="
echo ""

# Als root prüfen
if [ "$EUID" -ne 0 ]; then 
   echo "Bitte als root ausführen: sudo ./cleanup-mongodb.sh"
   exit 1
fi

echo "Schritt 1: Stoppe MongoDB Services..."
systemctl stop mongod 2>/dev/null || true
docker stop hotelpro-mongodb 2>/dev/null || true

echo "Schritt 2: Entferne alte MongoDB Pakete..."
apt-get remove -y mongodb-org* 2>/dev/null || true
apt-get purge -y mongodb-org* 2>/dev/null || true
apt-get autoremove -y

echo "Schritt 3: Entferne alte Repository-Konfigurationen..."
rm -f /etc/apt/sources.list.d/mongodb*.list
rm -f /usr/share/keyrings/mongodb*.gpg
rm -f /etc/apt/trusted.gpg.d/mongodb*.gpg

echo "Schritt 4: APT Cache bereinigen..."
apt-get clean
apt-get update

echo ""
echo "✓ Cleanup abgeschlossen!"
echo ""
echo "Nächster Schritt:"
echo "  ./proxmox-lxc/install-proxmox-lxc.sh"
echo ""
