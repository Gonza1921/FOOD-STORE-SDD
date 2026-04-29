## ADDED Requirements

### Requirement: JWT token creation
The system SHALL provide a function to create JWT access tokens with configurable expiration time. Tokens SHALL be signed using the SECRET_KEY from configuration. Tokens MUST include a sub (subject) claim and exp (expiration) claim in standard JWT format.

#### Scenario: Access token is created with default expiration
- **WHEN** `create_access_token(data={"sub": "user123"})` is called
- **THEN** a JWT token is returned that expires in JWT_ACCESS_TOKEN_EXPIRE_MINUTES

#### Scenario: Access token is created with custom expiration
- **WHEN** `create_access_token(data={"sub": "user123"}, expires_delta=timedelta(hours=2))` is called
- **THEN** a JWT token is returned that expires in 2 hours

#### Scenario: Token can be decoded
- **WHEN** a valid token created by `create_access_token` is decoded
- **THEN** the original data is recovered without error

### Requirement: JWT token verification
The system SHALL provide a function to verify and decode JWT tokens. Verification MUST check token signature, expiration, and format. Invalid or expired tokens MUST raise an exception.

#### Scenario: Valid token passes verification
- **WHEN** `verify_token(valid_token)` is called with a valid, non-expired token
- **THEN** the token payload is returned

#### Scenario: Expired token fails verification
- **WHEN** `verify_token(expired_token)` is called with an expired token
- **THEN** an exception is raised

#### Scenario: Tampered token fails verification
- **WHEN** `verify_token(tampered_token)` is called with a token that has been modified
- **THEN** an exception is raised

### Requirement: Password hashing utilities
The system SHALL provide functions to hash passwords and verify passwords against hashes using bcrypt. Hashed passwords MUST be salted and secure.

#### Scenario: Password is hashed
- **WHEN** `get_password_hash("mypassword")` is called
- **THEN** a hashed password is returned that is different from the input

#### Scenario: Correct password is verified
- **WHEN** `verify_password("mypassword", hashed_password)` is called with the correct password
- **THEN** True is returned

#### Scenario: Incorrect password is rejected
- **WHEN** `verify_password("wrongpassword", hashed_password)` is called with an incorrect password
- **THEN** False is returned
