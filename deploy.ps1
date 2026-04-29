# Deployment script for SmartOps Time Attendance
$DEST = "smartops:smartops-clients/casino-prestige/checador"
$REMOTE_DIR = "smartops-clients/casino-prestige/checador"

echo "Compressing files (excluding node_modules)..."
tar --exclude="frontend/node_modules" --exclude="frontend/dist" --exclude="backend/__pycache__" --exclude="backend/venv" -czf deploy.tar.gz backend frontend docker-compose.yml

echo "Creating remote directory..."
ssh smartops "mkdir -p $REMOTE_DIR"

echo "Uploading files (deploy.tar.gz)..."
scp deploy.tar.gz $DEST/deploy.tar.gz

echo "Extracting and starting services on VPS..."
ssh smartops "cd $REMOTE_DIR && tar -xzf deploy.tar.gz && rm deploy.tar.gz && docker-compose up -d --build && sleep 5 && docker exec smartops_attendance_backend python migrate.py && docker exec smartops_attendance_backend python clean_data.py"

echo "Cleaning up local files..."
Remove-Item deploy.tar.gz

echo "Deployment complete!"
