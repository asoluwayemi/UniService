-- Staff Profile & Records: centralized staff data (personal details, academic
-- qualifications, employment history, bank details, contract status).

CREATE TABLE staff_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    staff_number VARCHAR(30) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    phone VARCHAR(30),
    address VARCHAR(255),
    nationality VARCHAR(100),
    category VARCHAR(20) NOT NULL CHECK (category IN ('ACADEMIC', 'NON_ACADEMIC')),
    designation VARCHAR(150),
    org_unit_id BIGINT REFERENCES org_units(id),
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'ADJUNCT')),
    employment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (employment_status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'SEPARATED')),
    date_of_hire DATE NOT NULL,
    contract_start_date DATE,
    contract_end_date DATE,
    bank_name VARCHAR(150),
    bank_account_name VARCHAR(150),
    bank_account_number VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE UNIQUE INDEX uq_staff_profiles_staff_number ON staff_profiles (staff_number);

CREATE TABLE academic_qualifications (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    degree VARCHAR(150) NOT NULL,
    field_of_study VARCHAR(150),
    institution VARCHAR(200) NOT NULL,
    year_obtained INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE employment_history (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    organization VARCHAR(200) NOT NULL,
    position_title VARCHAR(150) NOT NULL,
    start_date DATE,
    end_date DATE,
    description VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
