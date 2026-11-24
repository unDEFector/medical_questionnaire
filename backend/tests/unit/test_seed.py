from sqlalchemy import func, select
from src.db import seed
from src.models.patient import Patient
from src.models.user import User, UserRole
from src.services.auth import create_user, verify_password


async def test_seed_adds_missing_demo_patients_without_resetting_existing_password(
    session_factory, monkeypatch
) -> None:
    monkeypatch.setattr(seed, "SessionFactory", session_factory)
    async with session_factory() as session:
        user = await create_user(session, "P-100001", "existing-password", UserRole.patient)
        session.add(Patient(user=user, height_cm=170, initial_weight_kg=75))
        await session.commit()

    await seed.seed_demo_data()

    async with session_factory() as session:
        users = (
            await session.scalars(
                select(User).where(User.public_id.in_(["P-100001", "P-100002", "P-100003"]))
            )
        ).all()
        assert len(users) == 3
        users_by_id = {user.public_id: user for user in users}
        assert verify_password("existing-password", users_by_id["P-100001"].password_hash)
        assert not verify_password(seed.DEMO_PATIENT_PASSWORD, users_by_id["P-100001"].password_hash)
        assert verify_password(seed.DEMO_PATIENT_PASSWORD, users_by_id["P-100002"].password_hash)
        assert verify_password(seed.DEMO_PATIENT_PASSWORD, users_by_id["P-100003"].password_hash)
        assert await session.scalar(select(func.count(Patient.id))) == 3

    await seed.seed_demo_data()

    async with session_factory() as session:
        assert await session.scalar(select(func.count(Patient.id))) == 3
