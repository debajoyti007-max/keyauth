# MONTAGE CORPORATION - License Management & KeyAuth Panel

Ultra-modern, glassmorphic KeyAuth and License Management System engineered for Free Fire (and expandable to PUBG Mobile / BGMI). Built with **Express**, **Node.js**, **React 19**, **Tailwind CSS**, and **Firebase Firestore / Embedded Storage**.

---

## 🚀 Quick Start (Local Run)

### 1. Start Developer Mode
Runs both the Express API backend and Vite React dashboard concurrently:
```bash
npm run dev
```

- **Dashboard UI**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:5000](http://localhost:5000)
- **C++ Client Handshake Endpoint**: `http://localhost:5000/connect`

### 2. Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `Owner` (Level 1 - Unlimited generation & full control)

---

## 🔌 C++ Android Client Handshake Integration

The `/connect` endpoint matches your C++ game client handshake:

### Request Contract
- **Method**: `POST`
- **URL**: `http://your-domain.com/connect`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**:
  ```ini
  game=FreeFire&user_key=MONTAGE-FF-XXXX-XXXX&serial=DEVICE-UUID-1234
  ```

### Response Contract
```json
{
  "status": true,
  "message": "Connected to MONTAGE CORPORATION successfully",
  "data": {
    "token": "00c6d1f8d5a8a103867eb1a466c55e8a",
    "EXP": "2026-10-05 02:45:00",
    "rng": 1788554800
  }
}
```

### Signature Token Algorithm
$$\text{token} = \text{MD5}(\text{game} + \text{"-"} + \text{user\_key} + \text{"-"} + \text{serial} + \text{"-"} + \text{secret\_key})$$

- **Replay Protection**: The client verifies `rng + 30 > time(0)`.
- **Default Secret Key**: `Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E` *(Editable anytime in Panel Settings)*.

---

## ⚡ Core Features

1. **Time Pause / Freeze Engine**:
   - When a key is paused, its remaining duration is calculated and frozen.
   - The game client is rejected with *"License key is currently paused by admin"*.
   - When unpaused, the key's expiry is restored from the preserved duration. **Zero customer time lost.**

2. **Start Countdown on First Use**:
   - Generated keys stay in **`Unused`** status indefinitely.
   - The timer (1 Day, 7 Days, etc.) only begins when the player launches Free Fire and activates the key on their device. Resellers can hold stock safely.

3. **Reseller Prepaid Wallet**:
   - Resellers have credit balances (e.g. ₹2,500).
   - Key generation automatically deducts from the reseller's wallet based on customizable duration prices:
     - 1 Day: ₹20
     - 7 Days: ₹100
     - 30 Days: ₹300
     - Lifetime: ₹800

4. **1-Click HWID Device Reset**:
   - Clear device lock per key with 1 click.
   - **Bulk Reset Tool**: Reset all Free Fire HWIDs instantly during game updates.
   - **Player Self-Service Portal**: Public link `/client-reset` with configurable 24-hour cooldown.

5. **Free Fire Safe Mode / Maintenance Switch**:
   - Toggle game status to Maintenance in Settings when Garena releases game patches. All client logins are temporarily paused to protect players from bans.

---

## 🔥 Optional Firebase Cloud Firestore Setup

By default, the panel uses a fast, zero-config local persistent database in `server/data/database.json`.

To switch to **Google Cloud Firebase**:
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Under **Project Settings > Service Accounts**, click **"Generate New Private Key"**.
3. Save the downloaded `.json` file as `server/serviceAccountKey.json`.
4. Restart the server:
   ```bash
   npm run dev
   ```
   The backend will automatically detect Firebase and display:
   `🔥 [Firebase] Successfully connected to Cloud Firestore!`

---

## 📦 How to Create a New GitHub Repository

To push this project to your own GitHub account:

1. Open your browser and go to: **[https://github.com/new](https://github.com/new)**
2. Name your repository: `montage-corporation-panel`
3. Leave it Public or Private, and do NOT check "Initialize with README". Click **"Create repository"**.
4. Run the following commands in PowerShell inside `c:\Users\Debajoyti\Documents\montage-corporation-panel`:

```powershell
git init
git add .
git commit -m "feat: initial commit for MONTAGE CORPORATION KeyAuth Panel"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/montage-corporation-panel.git
git push -u origin main
```
