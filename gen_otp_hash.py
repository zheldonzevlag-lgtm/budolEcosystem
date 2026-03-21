import bcrypt

# Generate a bcrypt hash for the OTP "555555"
otp = "555555"
hashed = bcrypt.hashpw(otp.encode(), bcrypt.gensalt(rounds=12)).decode()
print(f"Hash for {otp}:")
print(hashed)
