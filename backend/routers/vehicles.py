"""
Vehicle management endpoints.
GET /api/vehicles/ — list vehicles for current user
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
from deps import get_db, get_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("/")
async def list_vehicles(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Drivers see their assigned vehicles.
    Supervisors and admins see all active vehicles.
    """
    if current_user.role == "driver":
        result = await db.execute(
            text("""
                SELECT v.id, v.license_plate, v.vehicle_type, v.vendor_id,
                       vn.name as vendor_name
                FROM vehicles v
                LEFT JOIN vendors vn ON v.vendor_id = vn.id
                WHERE v.assigned_driver_id = :driver_id AND v.is_active = true
            """),
            {"driver_id": current_user.id}
        )
    else:
        result = await db.execute(
            text("""
                SELECT v.id, v.license_plate, v.vehicle_type, v.vendor_id,
                       vn.name as vendor_name,
                       u.name as driver_name, u.phone as driver_phone
                FROM vehicles v
                LEFT JOIN vendors vn ON v.vendor_id = vn.id
                LEFT JOIN users u ON v.assigned_driver_id = u.id
                WHERE v.is_active = true
                ORDER BY v.license_plate
            """)
        )

    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]