#!/bin/bash

source .env

# --- CONFIGURATION ---
BACKUP_SOURCE="/home/naufallofty/uptime-monitor"   
BUCKET_NAME=$AWS_BUCKET_NAME             
DATE=$(date +%Y-%m-%d-%H%M)                        
BACKUP_NAME="backup-$DATE.tar.gz"                  # The filename

# 1. Create the compressed file (Tarball)
echo "📦 Zipping files..."
tar -czf $BACKUP_NAME $BACKUP_SOURCE

# 2. Upload to AWS S3
echo "☁️ Uploading to S3..."
/usr/local/bin/aws s3 cp $BACKUP_NAME s3://$BUCKET_NAME/

# 3. Clean up (Delete the local file so your disk doesn't fill up)
echo "🧹 Cleaning up..."
rm $BACKUP_NAME

echo "✅ Backup Complete: $BACKUP_NAME"
