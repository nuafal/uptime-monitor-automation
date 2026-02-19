# 🛡️ Automated Server Monitoring & DObservability Dashboard

A production-grade, containerized automation suite designed to ensure high availability for web services. This project evolved from a simple Python watchdog into a **Full-Stack Observability Dashboard** with Docker orchestration, CI/CD pipelines, and global tunneling.

![Status](https://img.shields.io/badge/Status-Production-green)
![Tech](https://img.shields.io/badge/Stack-Node.js_|_Docker_|_Chart.js-blue)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)

## 🏗️ Architecture

```mermaid
graph TD
    %% 1. CI/CD Pipeline (Deployment)
    subgraph DevOps Pipeline
        Dev[💻 You] -->|Git Push| GitHub[🐙 GitHub Repo]
        GitHub -->|Trigger| Actions[⚙️ GitHub Actions]
        Actions -->|Build & Push Image| DockerHub[🐳 Docker Hub]
    end

    %% 2. Core Server & Container
    subgraph Production Server (Linux/WSL)
        DockerHub -.->|docker compose pull| Compose[📦 Docker Compose]
        
        subgraph Container: uptime-monitor
            Node[🟢 Node.js Watchdog]
            DB[(config/history.json)]
            UI[📊 src/dashboard.html]
        end
        
        Cron[⏱️ Linux Cron]
        Backup[📜 scripts/backup.sh]
    end

    %% 3. External Services & Access
    Internet((🌐 Target Websites))
    Discord[📢 Discord Webhook]
    AWS[☁️ AWS S3 Bucket]
    Tunnel[🥷 Ngrok Tunnel]
    PublicViewer[📱 Remote Access]

    %% --- Logic Flow Connections ---
    
    %% Setup
    Compose --> Node
    
    %% Monitoring Loop
    Node -- "1. Ping HTTP" --> Internet
    Node -- "2. Save Data" --> DB
    Node -- "3. Generate Chart" --> UI
    Node -- "4. Send Alert (If Down)" --> Discord
    
    %% Backup Loop
    Cron -- "Nightly Trigger" --> Backup
    Backup -- "Zip Config & Src" --> AWS

    %% Viewing
    Tunnel -- "Forward Port 9090" --> UI
    PublicViewer -- "Secure HTTPS" --> Tunnel
```

The system consists of two autonomous daemons:
1.  **The Watchdog (Python):** Monitors HTTP endpoints every 5 minutes. If a service (e.g., website, API) goes down, it triggers an instant alert to a Discord channel via Webhook.
2.  **The Safety Net (Bash):** Runs nightly at 00:00. It compresses critical project files and uploads them securely to an AWS S3 bucket for disaster recovery.

## 🚀 Features

* **Real-Time Downtime Alerts:** Immediate notification to mobile/desktop via Discord.
* **Automated Disaster Recovery (DR):** "Set and forget" backups to the Cloud.
* **Secure Configuration:** Uses `.env` environment variables to protect API keys and credentials.
* **Self-Healing:** Runs as a background daemon using Linux Crontab.
* **Cloud Integration:** Native integration with AWS CLI v2 for S3 storage.

## 🛠️ Tech Stack

* **Scripting:** Python 3 (Requests), Bash Shell
* **Cloud:** AWS S3 (Simple Storage Service)
* **Automation:** Linux Crontab (Cron)
* **Notifications:** Discord Webhooks
* **Security:** Python-dotenv

## ⚙️ Setup & Installation

### 1. Prerequisites
* Linux Server (Ubuntu/Debian) or WSL
* Python 3.x
* AWS CLI v2 installed and configured

### 2. Clone the Repository
```bash
git clone [https://github.com/nuafal/uptime-monitor-automation.git](https://github.com/naufallofty/uptime-monitor-automation.git](https://github.com/nuafal/uptime-monitor-automation.git)
