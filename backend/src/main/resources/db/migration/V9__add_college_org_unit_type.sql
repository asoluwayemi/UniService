-- Adds COLLEGE as a new top-level org unit type sitting above Faculty:
-- College -> Faculty -> Department -> Unit.

ALTER TABLE org_units DROP CONSTRAINT org_units_type_check;
ALTER TABLE org_units ADD CONSTRAINT org_units_type_check
    CHECK (type IN ('COLLEGE', 'FACULTY', 'DEPARTMENT', 'UNIT'));

ALTER TABLE org_unit_change_requests DROP CONSTRAINT org_unit_change_requests_proposed_type_check;
ALTER TABLE org_unit_change_requests ADD CONSTRAINT org_unit_change_requests_proposed_type_check
    CHECK (proposed_type IN ('COLLEGE', 'FACULTY', 'DEPARTMENT', 'UNIT'));
