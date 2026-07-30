-- Extends staff_profiles with fields needed to complete the "standard" staff
-- profile per the University of Ibadan Annual Staff Appraisal Form's Personal
-- Biodata section, and to support promotion-eligibility tracking.

ALTER TABLE staff_profiles ADD COLUMN date_of_first_appointment DATE;
ALTER TABLE staff_profiles ADD COLUMN date_appointed_to_present_post DATE;
ALTER TABLE staff_profiles ADD COLUMN schedule_of_duties VARCHAR(500);
ALTER TABLE staff_profiles ADD COLUMN present_scale_and_salary VARCHAR(100);
ALTER TABLE staff_profiles ADD COLUMN date_of_next_increment DATE;
ALTER TABLE staff_profiles ADD COLUMN last_promotion_date DATE;
