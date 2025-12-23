# SSH Connection Guide for Backend Server

This document provides instructions for another AI assistant on how to SSH into the backend server for the Audio Admin Dashboard project.

## Server Information

- **Server IP**: `68.183.22.205`
- **Default User**: `root`
- **Server Provider**: DigitalOcean
- **Purpose**: Hosts the Admin Dashboard and related backend services

## SSH Connection Methods

### Method 1: Standard SSH Connection (Password)

```bash
ssh root@68.183.22.205
```

When prompted, enter the server password. Note: This requires the password to be provided by the user.

### Method 2: SSH Connection with Key-Based Authentication (Recommended)

If SSH keys are configured:

```bash
# Using default SSH key
ssh root@68.183.22.205

# Using specific SSH key
ssh -i /path/to/private_key root@68.183.22.205
```

For the GitHub Actions deployment, the key is stored at:
- **Private Key Location** (local): `~/.ssh/github_deploy_key`
- **Public Key Location** (local): `~/.ssh/github_deploy_key.pub`

### Method 3: Using Deployment Script Variables

The project includes a deployment script ([deploy.sh](deploy.sh)) with predefined connection variables:

```bash
SERVER_USER="root"
SERVER_HOST="68.183.22.205"
```

To connect using these:
```bash
ssh ${SERVER_USER}@${SERVER_HOST}
# or simply
ssh root@68.183.22.205
```

## Key Server Locations

Once connected, the following directories are important:

### Web Application Directory
```bash
/var/www/admin
```
- Contains the deployed admin dashboard files
- Includes: `index.html`, `styles.css`, `app.js`

### Nginx Configuration
```bash
# Configuration file
/etc/nginx/sites-available/admin

# Enabled site
/etc/nginx/sites-enabled/admin
```

### SSH Configuration
```bash
# Authorized keys (for key-based authentication)
~/.ssh/authorized_keys

# SSH directory
~/.ssh/
```

## Common SSH Operations

### 1. Connect to Server
```bash
ssh root@68.183.22.205
```

### 2. Execute Single Command
```bash
ssh root@68.183.22.205 "command_to_execute"
```

Example:
```bash
ssh root@68.183.22.205 "ls -la /var/www/admin"
```

### 3. Copy Files to Server (SCP)
```bash
scp local_file.txt root@68.183.22.205:/var/www/admin/
```

### 4. Copy Files from Server
```bash
scp root@68.183.22.205:/var/www/admin/file.txt ./local_directory/
```

### 5. Copy Multiple Files
```bash
scp index.html styles.css app.js root@68.183.22.205:/var/www/admin/
```

## Setting Up SSH Key Authentication

If you need to set up SSH key authentication:

### 1. Generate SSH Key Pair
```bash
ssh-keygen -t ed25519 -C "deployment-key" -f ~/.ssh/deploy_key -N ""
```

### 2. Copy Public Key to Server
```bash
ssh-copy-id -i ~/.ssh/deploy_key.pub root@68.183.22.205
```

Or manually:
```bash
# Display public key
cat ~/.ssh/deploy_key.pub

# Then SSH into server and append it
ssh root@68.183.22.205
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. Connect Using the Key
```bash
ssh -i ~/.ssh/deploy_key root@68.183.22.205
```

## Troubleshooting

### Connection Refused
```bash
# Check if SSH service is running on server
ssh root@68.183.22.205 "systemctl status ssh"
```

### Permission Denied
- Verify you're using the correct username (`root`)
- Check if you have the correct password or SSH key
- Ensure SSH key has correct permissions: `chmod 600 ~/.ssh/private_key`

### Host Key Verification Failed
```bash
# Remove old host key and try again
ssh-keygen -R 68.183.22.205
ssh root@68.183.22.205
```

### Connection Timeout
- Verify server IP is correct: `68.183.22.205`
- Check network connectivity: `ping 68.183.22.205`
- Ensure firewall allows SSH (port 22)

## Security Best Practices

1. **Use SSH keys** instead of passwords
2. **Disable root login** after creating a sudo user (optional)
3. **Change default SSH port** from 22 (optional)
4. **Use fail2ban** to prevent brute force attacks
5. **Keep server updated**: `apt update && apt upgrade`

## Additional Context

### API Endpoint
The backend API runs at:
```
http://68.183.22.205:8080
```

### Nginx Management
```bash
# Restart Nginx
ssh root@68.183.22.205 "systemctl restart nginx"

# Check Nginx status
ssh root@68.183.22.205 "systemctl status nginx"

# Test Nginx configuration
ssh root@68.183.22.205 "nginx -t"
```

### File Permissions
```bash
# Set proper permissions for web files
ssh root@68.183.22.205 "chmod -R 755 /var/www/admin"
```

## Quick Reference Commands

```bash
# Connect
ssh root@68.183.22.205

# Deploy files
scp index.html styles.css app.js root@68.183.22.205:/var/www/admin/

# Restart nginx
ssh root@68.183.22.205 "systemctl restart nginx"

# Check deployment directory
ssh root@68.183.22.205 "ls -la /var/www/admin"

# View nginx logs
ssh root@68.183.22.205 "tail -f /var/log/nginx/access.log"
ssh root@68.183.22.205 "tail -f /var/log/nginx/error.log"
```

## Notes for AI Assistants

- Always verify the server IP: `68.183.22.205`
- Default user is `root` - may need to ask user for credentials
- Server hosts both the admin dashboard (port 80/nginx) and API (port 8080)
- Key files are deployed to `/var/www/admin`
- CI/CD is set up via GitHub Actions (see [DEPLOYMENT.md](DEPLOYMENT.md))
- For automated deployment, credentials are stored in GitHub Secrets


