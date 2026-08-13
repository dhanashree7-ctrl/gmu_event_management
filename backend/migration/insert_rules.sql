USE GMU_Events01;

INSERT INTO approval_rules (scale_name, required_chain) VALUES 
('department', '["hod"]'), 
('faculty', '["hod", "director"]'), 
('university', '["hod", "dean", "pro_vc", "vc"]'), 
('state', '["hod", "director", "dean", "pro_vc", "vc"]'), 
('national', '["hod", "director", "dean", "pro_vc", "vc"]'), 
('international', '["hod", "director", "dean", "pro_vc", "vc"]');
