# db-engine — Portable MariaDB Binaries

This directory must contain a portable (ZIP-extracted) MariaDB installation **before** building the production EXE.

## Required Structure

```
db-engine/
└── bin/
    ├── mysqld.exe           ← Main database server process (REQUIRED)
    ├── mysqladmin.exe       ← Admin utility
    ├── mysql.exe            ← CLI client
    └── *.dll                ← Required runtime DLLs
```

## How to Populate

Run the automated setup script from the project root:

```powershell
# Windows PowerShell
cd <repo-root>
.\scripts\setup-mariadb.ps1
```

The script will:
1. Download MariaDB 11.x portable ZIP (~120 MB)
2. Extract only the `bin/` directory into `desktop/db-engine/bin/`
3. Verify `mysqld.exe` is present

## Manual Download

If the script fails, download manually:

1. Go to: https://downloads.mariadb.org/mariadb/
2. Choose **MariaDB 11.x** → **Windows (ZIP)**
3. Extract the ZIP
4. Copy the `bin/` folder from the extracted archive into this `db-engine/` directory

## Notes

- The `db-engine/` binaries are **NOT tracked by git** (see `.gitignore`)
- Only this `README.md` and `.gitkeep` are committed
- The binaries are bundled into the EXE installer via `electron-builder extraResources`
- MariaDB data files are stored in `%APPDATA%\hotel-checkin-desktop\data\` (never in this folder)
