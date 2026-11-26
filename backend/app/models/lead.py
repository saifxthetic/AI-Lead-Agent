from pydantic import BaseModel, EmailStr, Field


class LeadCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    message: str = Field(
        min_length=5,
        max_length=3000
    )