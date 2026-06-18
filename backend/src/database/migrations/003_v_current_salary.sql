-- Latest salary per employee with USD normalization

DROP VIEW IF EXISTS v_current_salary;

CREATE VIEW v_current_salary AS
SELECT
  s.employee_id,
  s.id AS salary_id,
  s.base_salary,
  s.currency_code,
  s.country,
  s.effective_date,
  s.base_salary * c.rate_to_usd AS base_salary_usd
FROM salaries s
INNER JOIN currencies c ON c.code = s.currency_code
WHERE s.id = (
  SELECT s2.id
  FROM salaries s2
  WHERE s2.employee_id = s.employee_id
  ORDER BY s2.effective_date DESC, s2.id DESC
  LIMIT 1
);
