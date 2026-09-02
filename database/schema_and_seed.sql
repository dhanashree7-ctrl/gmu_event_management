-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: GMU_Events01
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approval_rules`
--

CREATE TABLE IF NOT EXISTS `approval_rules` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `SCALE_NAME` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `REQUIRED_CHAIN` json NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `scale_name` (`SCALE_NAME`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `approval_rules`
--

INSERT INTO `approval_rules` VALUES (1,'department','[\"hod\"]'),(2,'faculty','[\"hod\", \"director\"]'),(3,'university','[\"hod\", \"dean\", \"pro_vc\", \"vc\"]'),(4,'state','[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]'),(5,'national','[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]'),(6,'international','[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]');

--
-- Table structure for table `event_master`
--

CREATE TABLE IF NOT EXISTS `event_master` (
  `EVENT_ID` int NOT NULL AUTO_INCREMENT,
  `PROPOSER_ID` varchar(50) NOT NULL,
  `EVENT_TITLE` varchar(200) NOT NULL,
  `DESCRIPTION` text NOT NULL,
  `CATEGORY` varchar(50) NOT NULL,
  `SCALE` varchar(50) NOT NULL,
  `MODE` varchar(50) NOT NULL,
  `VENUE` varchar(100) DEFAULT NULL,
  `START_DATE` date NOT NULL,
  `END_DATE` date NOT NULL,
  `START_TIME` time DEFAULT NULL,
  `END_TIME` time DEFAULT NULL,
  `REGISTRATION_DEADLINE` datetime DEFAULT NULL,
  `MAX_PARTICIPANTS` int DEFAULT NULL,
  `BUDGET` decimal(10,2) DEFAULT '0.00',
  `COORDINATOR_NAME` varchar(100) DEFAULT NULL,
  `CORDINATOR_CONTACT` varchar(50) DEFAULT NULL,
  `SUB_EVENT_ID` varchar(255) DEFAULT NULL,
  `SUB_EVENT_NAME` varchar(255) DEFAULT NULL,
  `SUB_EVENT_DESC` text,
  `ACADEMIC_YEAR` varchar(10) DEFAULT NULL,
  `SEASON` varchar(10) DEFAULT NULL,
  `SEM` int DEFAULT NULL,
  `SECTION` varchar(10) DEFAULT NULL,
  `SUBJECT_CODE` varchar(15) DEFAULT NULL,
  `SUBJECT` varchar(100) DEFAULT NULL,
  `PARTICULAR` varchar(50) DEFAULT NULL,
  `ATTACHMENTS` json DEFAULT NULL,
  `CURRENT_STATUS` varchar(50) DEFAULT 'pending_hod',
  `APPROVAL_WORKFLOW` json DEFAULT NULL,
  `NOTIFICATION_SENT` tinyint(1) DEFAULT '0' COMMENT 'FCM broadcast lock — 1 = already fired, prevents duplicate pushes',
  PRIMARY KEY (`EVENT_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `event_master`
--

INSERT INTO `event_master` VALUES (1,'csfac01','Global Tech Symposium 2026','A premier tech gathering featuring keynotes from industry leaders, panel discussions on AI, and networking sessions.','Academic','university','Offline','Main Auditorium','2026-08-10','2026-08-11','09:00:00','09:00:00','2026-08-09 00:00:00',162,4808.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"report\": \"uploads/event_report_dummy.pdf\", \"details\": {\"is_festival\": false, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','completed','[]',1),(2,'csfac01','Cultural Fest - Milan 2026','The annual cultural extravaganza of GM University! Dance, music, art, and drama competitions.','Cultural','university','Offline','Open Air Theatre','2026-08-15','2026-08-16','17:00:00','17:00:00','2026-08-14 00:00:00',52,3813.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"report\": \"uploads/event_report_dummy.pdf\", \"details\": {\"sub_events\": [\"Battle of Bands\", \"Solo Dance\", \"Face Painting\", \"Fashion Show\"], \"is_festival\": true, \"participation_type\": \"team\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','completed','[]',1),(3,'csfac01','AI & Robotics Bootcamp','A hands-on intensive bootcamp on building intelligent robotics systems using ROS and Python.','Academic','university','Offline','Robotics Lab','2026-09-20','2026-09-22','10:00:00','10:00:00','2026-09-19 00:00:00',76,8354.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"is_festival\": false, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','published','[]',1),(4,'csfac01','Inter-Collegiate Football Tournament','Knockout tournament for football teams across the state. Huge cash prizes to be won!','Sports','university','Offline','University Stadium','2026-10-05','2026-10-07','08:00:00','08:00:00','2026-10-04 00:00:00',169,8517.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"sub_events\": [\"Men Football\", \"Women Football\"], \"is_festival\": true, \"participation_type\": \"team\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','published','[]',1),(5,'csfac01','Cybersecurity Hackathon 24h','Capture the flag and defend your infrastructure. 24 hours of non-stop hacking.','Academic','department','Online','Discord Server','2026-07-01','2026-07-02','12:00:00','12:00:00','2026-06-30 00:00:00',97,7988.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"report\": \"uploads/event_report_dummy.pdf\", \"details\": {\"is_festival\": false, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','completed','[]',1),(6,'csfac01','Guest Lecture: Quantum Computing','Eminent scientist Dr. Feynman will introduce the fundamentals of Quantum Information Theory.','Academic','university','Offline','Seminar Hall A','2026-10-15','2026-10-15','14:00:00','14:00:00','2026-10-14 00:00:00',188,9923.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"is_festival\": false, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','pending_dean','[]',1),(7,'csfac01','Annual Sports Meet 2026','Track and field events, relay races, and more to celebrate the athletic spirit of GMU.','Sports','university','Offline','University Stadium','2026-11-01','2026-11-03','07:00:00','07:00:00','2026-10-31 00:00:00',57,3686.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"sub_events\": [\"100m Sprint\", \"Long Jump\", \"Relay 4x100m\"], \"is_festival\": true, \"participation_type\": \"team\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','published','[]',1),(8,'csfac01','Photography Exhibition','Showcasing the best clicks from our student body. Theme: Nature and Concrete.','Cultural','university','Offline','Art Gallery','2026-05-10','2026-05-12','10:00:00','10:00:00','2026-05-09 00:00:00',87,9210.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"report\": \"uploads/event_report_dummy.pdf\", \"details\": {\"is_festival\": false, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','completed','[]',1),(9,'csfac01','Faculty Development Program on Web3','Training program for university faculty on blockchain, smart contracts and decentralization.','Academic','university','Online','Zoom','2026-11-20','2026-11-25','16:00:00','16:00:00','2026-11-19 00:00:00',70,8985.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"is_festival\": false, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','pending_vc','[]',1),(10,'csfac01','Department Debate Competition','CSE students battle it out on topics of Tech Ethics and AI dominance.','Cultural','department','Offline','Room 404','2026-09-30','2026-09-30','15:00:00','15:00:00','2026-09-29 00:00:00',68,7492.00,'Prof. John Doe','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"is_festival\": false, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_brochure_dummy.pdf\"}','published','[]',1);

--
-- Table structure for table `event_registrations`
--

CREATE TABLE IF NOT EXISTS `event_registrations` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `EVENT_ID` varchar(80) NOT NULL,
  `USER_ID` varchar(50) DEFAULT NULL,
  `SUB_EVENT_ID` varchar(50) DEFAULT NULL,
  `ROLE` enum('participant','volunteer','coordinator') NOT NULL DEFAULT 'participant',
  `REGISTRATION_DATE` datetime DEFAULT CURRENT_TIMESTAMP,
  `CHECK_IN_STATUS` varchar(50) DEFAULT 'pending',
  `CHECK_IN_TIME` datetime DEFAULT NULL,
  `QR_CODE` varchar(255) DEFAULT NULL,
  `FEEDBACK_JSON` json DEFAULT NULL,
  `CERTIFICATE_URL` varchar(500) DEFAULT NULL,
  `TEAM_LEAD` varchar(100) DEFAULT NULL,
  `TEAM_MEMBERS` text,
  `EXTERNAL_DETAILS` json DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `event_registrations`
--


INSERT INTO `event_registrations` VALUES (1,'1','U23E01AI015',NULL,'coordinator','2026-08-03 00:00:00','checked_in','2026-08-10 00:30:00','EVT-1-STU-6a97ae98b71da',NULL,NULL,NULL,NULL,NULL),(2,'1','U23E01CS018',NULL,'volunteer','2026-08-03 00:00:00','checked_in','2026-08-10 00:30:00','EVT-1-STU-6a97ae98b784b','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(3,'1','U23E01AI002',NULL,'volunteer','2026-08-06 00:00:00','checked_in','2026-08-10 00:30:00','EVT-1-STU-6a97ae98b8321','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(4,'1','U23E01CC009',NULL,'participant','2026-08-02 00:00:00','checked_in','2026-08-10 00:30:00','EVT-1-STU-6a97ae98b87fe','{\"rating\": 5, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,'{\"external_college_name\": \"RV College\"}'),(5,'1','U23E01CS056',NULL,'participant','2026-08-02 00:00:00','pending',NULL,'EVT-1-STU-6a97ae98b8dbf',NULL,NULL,NULL,NULL,NULL),(6,'2','U23E01AI002',NULL,'coordinator','2026-08-13 00:00:00','checked_in','2026-08-15 00:30:00','EVT-2-STU-6a97ae98b9ab6',NULL,NULL,'ABHISHEK B S','Student X, Student Y, Student Z','{\"registered_sub_events\": [\"Fashion Show\"]}'),(7,'2','U23E01AI025',NULL,'volunteer','2026-08-10 00:00:00','checked_in','2026-08-15 00:30:00','EVT-2-STU-6a97ae98ba33d','{\"rating\": 5, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,'{\"registered_sub_events\": [\"Fashion Show\"]}'),(8,'2','U23E02EC032',NULL,'volunteer','2026-08-12 00:00:00','checked_in','2026-08-15 00:30:00','EVT-2-STU-6a97ae98baa28',NULL,NULL,NULL,NULL,'{\"registered_sub_events\": [\"Solo Dance\"]}'),(9,'2','U23E02EC045',NULL,'participant','2026-08-09 00:00:00','checked_in','2026-08-15 00:30:00','EVT-2-STU-6a97ae98bafc1','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,'ZAINAB RAHIL QUAZI','Student X, Student Y, Student Z','{\"registered_sub_events\": [\"Battle of Bands\"]}'),(10,'2','U23E01CY017',NULL,'participant','2026-08-05 00:00:00','checked_in','2026-08-15 00:30:00','EVT-2-STU-6a97ae98bb5d0',NULL,NULL,NULL,NULL,'{\"registered_sub_events\": [\"Fashion Show\"]}'),(11,'2','U23E01AI015',NULL,'participant','2026-08-09 00:00:00','checked_in','2026-08-15 00:30:00','EVT-2-STU-6a97ae98bbba1','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,'{\"external_college_name\": \"MIT Manipal\", \"registered_sub_events\": [\"Solo Dance\"]}'),(12,'2','U23E01CS056',NULL,'participant','2026-08-06 00:00:00','pending',NULL,'EVT-2-STU-6a97ae98bc21b',NULL,NULL,'RAVIKUMAR V','Student X, Student Y, Student Z','{\"external_college_name\": \"BMS College\", \"registered_sub_events\": [\"Face Painting\"]}'),(13,'3','U23E01CS036',NULL,'coordinator','2026-09-16 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98bcc6f',NULL,NULL,NULL,NULL,NULL),(14,'3','U23E01CC009',NULL,'volunteer','2026-09-17 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98bd13d',NULL,NULL,NULL,NULL,NULL),(15,'3','U23E02EC037',NULL,'volunteer','2026-09-18 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98bd670',NULL,NULL,NULL,NULL,NULL),(16,'3','U23E01AI002',NULL,'participant','2026-09-17 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98bdcd5',NULL,NULL,NULL,NULL,NULL),(17,'3','U23E01AI030',NULL,'participant','2026-09-14 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98be509',NULL,NULL,NULL,NULL,NULL),(18,'3','U23E02EC032',NULL,'participant','2026-09-11 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98bed21',NULL,NULL,NULL,NULL,NULL),(19,'3','GMU23EC2',NULL,'participant','2026-09-17 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98bf4de',NULL,NULL,NULL,NULL,NULL),(20,'3','U23E01CS085',NULL,'participant','2026-09-11 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98c01e4',NULL,NULL,NULL,NULL,NULL),(21,'3','U23E01CS013',NULL,'participant','2026-09-11 00:00:00','pending',NULL,'EVT-3-STU-6a97ae98c0b5e',NULL,NULL,NULL,NULL,NULL),(22,'4','U23E01CS018',NULL,'coordinator','2026-09-27 00:00:00','pending',NULL,'EVT-4-STU-6a97ae98c17ac',NULL,NULL,'KARTHIK J N PATEL','Student X, Student Y, Student Z','{\"registered_sub_events\": [\"Women Football\"]}'),(23,'4','U23E02EC037',NULL,'volunteer','2026-10-01 00:00:00','pending',NULL,'EVT-4-STU-6a97ae98c1db0',NULL,NULL,NULL,NULL,'{\"registered_sub_events\": [\"Men Football\"]}'),(24,'4','U23E01AI002',NULL,'volunteer','2026-09-29 00:00:00','pending',NULL,'EVT-4-STU-6a97ae98c2331',NULL,NULL,NULL,NULL,'{\"registered_sub_events\": [\"Women Football\"]}'),(25,'4','U23E01CS027',NULL,'participant','2026-09-25 00:00:00','pending',NULL,'EVT-4-STU-6a97ae98c2ad0',NULL,NULL,'KUSHALA PATIL','Student X, Student Y, Student Z','{\"external_college_name\": \"MIT Manipal\", \"registered_sub_events\": [\"Men Football\"]}'),(26,'4','U23E01CS036',NULL,'participant','2026-09-28 00:00:00','pending',NULL,'EVT-4-STU-6a97ae98c30e8',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"BMS College\", \"registered_sub_events\": [\"Women Football\"]}'),(27,'5','U23E01AI002',NULL,'coordinator','2026-06-22 00:00:00','checked_in','2026-07-01 00:30:00','EVT-5-STU-6a97ae98c3e56',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"RV College\"}'),(28,'5','U23E02EC037',NULL,'volunteer','2026-06-23 00:00:00','pending',NULL,'EVT-5-STU-6a97ae98c43a2',NULL,NULL,NULL,NULL,NULL),(29,'5','U23E01CS036',NULL,'volunteer','2026-06-21 00:00:00','pending',NULL,'EVT-5-STU-6a97ae98c49ec',NULL,NULL,NULL,NULL,NULL),(30,'5','U23E01AI034',NULL,'participant','2026-06-26 00:00:00','checked_in','2026-07-01 00:30:00','EVT-5-STU-6a97ae98c508f',NULL,NULL,NULL,NULL,NULL),(31,'5','U23E01CC009',NULL,'participant','2026-06-23 00:00:00','checked_in','2026-07-01 00:30:00','EVT-5-STU-6a97ae98c5632','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(32,'5','U23E01CY017',NULL,'participant','2026-06-22 00:00:00','checked_in','2026-07-01 00:30:00','EVT-5-STU-6a97ae98c5cc1',NULL,NULL,NULL,NULL,NULL),(33,'5','U23E02EC032',NULL,'participant','2026-06-25 00:00:00','checked_in','2026-07-01 00:30:00','EVT-5-STU-6a97ae98c64a5','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(34,'5','U23E02EC045',NULL,'participant','2026-06-27 00:00:00','checked_in','2026-07-01 00:30:00','EVT-5-STU-6a97ae98c6ab9','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(35,'5','U23E01AI015',NULL,'participant','2026-06-21 00:00:00','checked_in','2026-07-01 00:30:00','EVT-5-STU-6a97ae98c6f25',NULL,NULL,NULL,NULL,NULL),(36,'5','U23E01CS058',NULL,'participant','2026-06-26 00:00:00','pending',NULL,'EVT-5-STU-6a97ae98c744e',NULL,NULL,NULL,NULL,NULL),(37,'5','GMU23EC2',NULL,'participant','2026-06-27 00:00:00','checked_in','2026-07-01 00:30:00','EVT-5-STU-6a97ae98c7985',NULL,NULL,NULL,NULL,NULL),(38,'7','U23E01AI034',NULL,'coordinator','2026-10-22 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98c8a7f',NULL,NULL,'MOHAMMAD  GOUSE M SIDDI','Student X, Student Y, Student Z','{\"external_college_name\": \"BMS College\", \"registered_sub_events\": [\"100m Sprint\"]}'),(39,'7','U23E01CS058',NULL,'volunteer','2026-10-29 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98c90c8',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"MIT Manipal\", \"registered_sub_events\": [\"100m Sprint\"]}'),(40,'7','U23E01AI025',NULL,'volunteer','2026-10-26 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98c967a',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"MIT Manipal\", \"registered_sub_events\": [\"Long Jump\"]}'),(41,'7','U23E01CS018',NULL,'participant','2026-10-30 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98c9dfc',NULL,NULL,'KARTHIK J N PATEL','Student X, Student Y, Student Z','{\"registered_sub_events\": [\"Long Jump\"]}'),(42,'7','U23E01CS036',NULL,'participant','2026-10-23 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98ca5d7',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"BMS College\", \"registered_sub_events\": [\"Relay 4x100m\"]}'),(43,'7','U23E01AI015',NULL,'participant','2026-10-30 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98cab28',NULL,NULL,NULL,NULL,'{\"registered_sub_events\": [\"100m Sprint\"]}'),(44,'7','U23E01CY017',NULL,'participant','2026-10-27 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98caefb',NULL,NULL,'MOHAMMED ASADULLA K','Student X, Student Y, Student Z','{\"external_college_name\": \"BMS College\", \"registered_sub_events\": [\"Long Jump\"]}'),(45,'7','U23E01AI036',NULL,'participant','2026-10-23 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98cb431',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"BMS College\", \"registered_sub_events\": [\"Long Jump\"]}'),(46,'7','U23E01AI030',NULL,'participant','2026-10-27 00:00:00','pending',NULL,'EVT-7-STU-6a97ae98cb8f3',NULL,NULL,NULL,NULL,'{\"registered_sub_events\": [\"Relay 4x100m\"]}'),(47,'8','U23E01CY017',NULL,'coordinator','2026-05-07 00:00:00','pending',NULL,'EVT-8-STU-6a97ae98cc3b5',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"RV College\"}'),(48,'8','U23E01AI025',NULL,'volunteer','2026-05-08 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98cc86f','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(49,'8','U23E01CS085',NULL,'volunteer','2026-05-05 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98ccc84',NULL,NULL,NULL,NULL,NULL),(50,'8','U23E01CS069',NULL,'participant','2026-05-02 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98cd09d',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"RV College\"}'),(51,'8','U23E01AI002',NULL,'participant','2026-05-04 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98cd5cf',NULL,NULL,NULL,NULL,NULL),(52,'8','U23E01CS013',NULL,'participant','2026-05-08 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98cdd88','{\"rating\": 5, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(53,'8','U23E02EC045',NULL,'participant','2026-05-07 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98ce561','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,'{\"external_college_name\": \"RV College\"}'),(54,'8','U23E01CS027',NULL,'participant','2026-05-04 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98ce9aa',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"RV College\"}'),(55,'8','U23E01AI034',NULL,'participant','2026-05-04 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98cef40',NULL,NULL,NULL,NULL,NULL),(56,'8','U23E01CS056',NULL,'participant','2026-05-05 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98cf365','{\"rating\": 5, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,'{\"external_college_name\": \"RV College\"}'),(57,'8','U23E02EC037',NULL,'participant','2026-05-01 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98cf855',NULL,NULL,NULL,NULL,NULL),(58,'8','U23E01AI036',NULL,'participant','2026-05-03 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98cfe71',NULL,NULL,NULL,NULL,NULL),(59,'8','U23E01CS018',NULL,'participant','2026-04-30 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98d03a6',NULL,NULL,NULL,NULL,'{\"external_college_name\": \"RV College\"}'),(60,'8','U23E01CS036',NULL,'participant','2026-05-02 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98d0950','{\"rating\": 5, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(61,'8','U23E01AI015',NULL,'participant','2026-04-30 00:00:00','checked_in','2026-05-10 00:30:00','EVT-8-STU-6a97ae98d0e92','{\"rating\": 4, \"comment\": \"Great event! Really enjoyed the sessions.\"}',NULL,NULL,NULL,NULL),(62,'10','U23E01AI002',NULL,'coordinator','2026-09-23 00:00:00','pending',NULL,'EVT-10-STU-6a97ae98d2b6a',NULL,NULL,NULL,NULL,NULL),(63,'10','U23E01CS027',NULL,'volunteer','2026-09-25 00:00:00','pending',NULL,'EVT-10-STU-6a97ae98d2fda',NULL,NULL,NULL,NULL,NULL),(64,'10','U23E01AI030',NULL,'volunteer','2026-09-22 00:00:00','pending',NULL,'EVT-10-STU-6a97ae98d359b',NULL,NULL,NULL,NULL,NULL),(65,'10','U23E01AI036',NULL,'participant','2026-09-20 00:00:00','pending',NULL,'EVT-10-STU-6a97ae98d3b97',NULL,NULL,NULL,NULL,NULL),(66,'10','U23E01CS056',NULL,'participant','2026-09-23 00:00:00','pending',NULL,'EVT-10-STU-6a97ae98d405f',NULL,NULL,NULL,NULL,NULL);
-- IMPORTANT: ENTERPRISE USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
-- The 'users' table is NOT defined here. It is managed by the university's
-- central enterprise system and must be imported separately.
--
-- Deploy the enterprise users table first:
--   mysql -u root -p <db_name> < users.sql
--
-- Then import this file:
--   mysql -u root -p <db_name> < schema_and_seed.sql
--
-- Key enterprise columns used by this application:
--   USER_NAME    → login identifier (e.g. U23E01CS018, cshod01)
--   PASSWORD     → bcrypt-hashed password
--   NAME         → full name
--   DESIGNATION  → determines role (HOD, PROFESSOR, DIRECTOR, STUDENT, etc.)
--   USER_GROUP   → secondary group (STUDENT, FACULTY, ACCOUNTS, etc.)
--   DISCIPLINE   → department (e.g. CSE, ECE, CSE-AIML)
--   FACULTY      → faculty name (e.g. FET, GMIT)
--   SCHOOL       → school (e.g. SCST, SE)
--   device_token → Firebase Cloud Messaging push token
--   STATUS       → ACTIVE / CLOSED
-- ─────────────────────────────────────────────────────────────────────────────


/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-31 12:33:03



