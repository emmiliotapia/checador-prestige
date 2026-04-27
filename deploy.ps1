# Deployment script for SmartOps Time Attendance
$DEST = "smartops:smartops-clients/casino-prestige/checador"

echo "Creating remote directory..."
ssh smartops "mkdir -p smartops-clients/casino-prestige/checador"

echo "Uploading files..."
# Exclude node_modules, __pycache__, etc.
scp -r backend frontend docker-compose.yml $DEST

echo "Starting services on VPS..."
ssh smartops "cd smartops-clients/casino-prestige/checador && docker-compose up -d --build"

echo "Deployment complete!"
