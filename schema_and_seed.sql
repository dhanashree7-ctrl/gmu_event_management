-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: GMU_Events01
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approval_rules`
--

DROP TABLE IF EXISTS `approval_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_rules` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `SCALE_NAME` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `REQUIRED_CHAIN` json NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `scale_name` (`SCALE_NAME`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_rules`
--

LOCK TABLES `approval_rules` WRITE;
/*!40000 ALTER TABLE `approval_rules` DISABLE KEYS */;
INSERT INTO `approval_rules` VALUES (1,'department','[\"hod\"]'),(2,'faculty','[\"hod\", \"director\"]'),(3,'university','[\"hod\", \"dean\", \"pro_vc\", \"vc\"]'),(4,'state','[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]'),(5,'national','[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]'),(6,'international','[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]');
/*!40000 ALTER TABLE `approval_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_master`
--

DROP TABLE IF EXISTS `event_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_master` (
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
  `notification_sent` tinyint(1) DEFAULT '0' COMMENT 'FCM broadcast lock — 1 = already fired, prevents duplicate pushes',
  PRIMARY KEY (`EVENT_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_master`
--

LOCK TABLES `event_master` WRITE;
/*!40000 ALTER TABLE `event_master` DISABLE KEYS */;
INSERT INTO `event_master` VALUES (1,'events_admin','AI Seminar','XYZ','Academic','department','offline','Main Auditorium','2026-08-27','2026-08-27','10:00:00','13:00:00',NULL,NULL,2000.00,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"brochure\": \"uploads/event_proposal_1787804447_6a8fbb1f41865.pdf\"}','pending_hod','{\"route\": [\"hod\"], \"history\": [], \"current_step\": 0}',0),(2,'events_admin','Farewell','xyz','Cultural','department','offline','Auditorium','2026-08-27','2026-08-27','10:00:00','17:00:00',NULL,NULL,2000.00,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"brochure\": \"uploads/event_proposal_1787805867_6a8fc0abc51ab.pdf\"}','pending_hod','{\"route\": [\"hod\"], \"history\": [], \"current_step\": 0}',0),(3,'csfac01','Webinar','xyz','Academic','department','offline','Block C','2026-08-29','2026-08-29','10:00:00','12:00:00',NULL,NULL,1000.00,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"brochure\": \"uploads/event_proposal_1787809132_6a8fcd6c91ed4.pdf\"}','published','{\"route\": [\"hod\"], \"history\": [{\"notes\": \"\", \"user_id\": \"cshod01\", \"created_at\": \"2026-08-27T07:40:22+02:00\", \"action_taken\": \"published\"}], \"current_step\": 1}',0),(5,'csfac01','Browser Subagent End-to-End Event','E2E testing of event creation by browser subagent.','Academic','department','offline','CSE Seminar Hall','2026-08-28','2026-08-28','10:00:00','12:00:00','2026-08-28 00:00:00',100,500.00,'Prof. Alice CSE','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"coordinator_name\": \"Prof. Alice CSE\"}, \"brochure\": \"uploads/event_proposal_1787833705_6a902d69c2108.pdf\"}','published','{\"route\": [\"hod\"], \"history\": [{\"notes\": \"\", \"user_id\": \"cshod01\", \"created_at\": \"2026-08-27T14:31:13+02:00\", \"action_taken\": \"published\"}], \"current_step\": 1}',0),(6,'csfac01','test','abcd','Academic','department','offline','Block A','2026-09-10','2026-09-10','10:00:00','17:00:00','2026-09-05 00:00:00',100,1000.00,'Dr. B','1234567890',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"coordinator_name\": \"Dr. B\"}, \"brochure\": \"uploads/event_proposal_1787986085_6a9280a5c6fda.pdf\"}','published','{\"route\": [\"hod\"], \"history\": [{\"notes\": \"\", \"user_id\": \"cshod01\", \"created_at\": \"2026-08-29T09:00:13+02:00\", \"action_taken\": \"published\"}], \"current_step\": 1}',1),(7,'csfac01','test1','a','Academic','department','offline','A','2026-09-10','2026-09-10','10:00:00','17:00:00','2026-09-09 00:00:00',111,111.00,'ss','ioswwioi',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"coordinator_name\": \"ss\"}, \"brochure\": \"uploads/event_proposal_1787988345_6a928979e30e2.pdf\"}','published','{\"route\": [\"hod\"], \"history\": [{\"notes\": \"\", \"user_id\": \"cshod01\", \"created_at\": \"2026-08-29T09:39:32+02:00\", \"action_taken\": \"published\"}], \"current_step\": 1}',1),(8,'csfac01','test2','a','Academic','department','offline','block a','2027-01-10','2027-01-10','10:00:00','17:00:00','2026-10-10 00:00:00',109,100.00,'q','a',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"coordinator_name\": \"q\"}, \"brochure\": \"uploads/event_proposal_1787988886_6a928b964ac8a.pdf\"}','published','{\"route\": [\"hod\"], \"history\": [{\"notes\": \"\", \"user_id\": \"cshod01\", \"created_at\": \"2026-08-29T09:43:28+02:00\", \"action_taken\": \"published\"}], \"current_step\": 1}',1),(9,'csfac01','test 3','s','Cultural','department','offline','d','2026-10-10','2026-10-10','19:00:00','21:00:00','2026-09-10 00:00:00',10,1000.00,'s','s',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"coordinator_name\": \"s\"}, \"brochure\": \"uploads/event_proposal_1787989330_6a928d526a72c.pdf\"}','pending_hod','{\"route\": [\"hod\"], \"history\": [], \"current_step\": 0}',0),(10,'csfac01','test4','s','Academic','department','offline','a','2026-10-10','2026-10-10','10:00:00','13:00:00','2026-09-10 00:00:00',100,99.98,'a','s',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"coordinator_name\": \"a\"}, \"brochure\": \"uploads/event_proposal_1787989696_6a928ec0981c2.png\"}','pending_hod','{\"route\": [\"hod\"], \"history\": [], \"current_step\": 0}',0),(11,'csfac01','test4','xyz','Academic','faculty','offline','a','2026-01-10','2026-01-10','10:00:00','15:00:00','2026-12-12 00:00:00',12,100.00,'z','z',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"coordinator_name\": \"z\"}, \"brochure\": \"uploads/event_proposal_1788007434_6a92d40abdc36.png\"}','rejected','{\"route\": [\"hod\", \"director\"], \"history\": [{\"notes\": \"no\", \"user_id\": \"cshod01\", \"created_at\": \"2026-08-29T19:56:29+02:00\", \"action_taken\": \"rejected\"}], \"current_step\": 0}',0),(12,'csfac01','test5','d','Academic','department','offline','a','2026-10-10','2026-10-10','10:00:00','17:00:00','2026-09-10 00:00:00',11,20000.00,'s','d',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"coordinator_name\": \"s\"}, \"brochure\": \"uploads/event_proposal_1788016820_6a92f8b404bca.png\"}','published','{\"route\": [\"hod\"], \"history\": [{\"notes\": \"\", \"user_id\": \"cshod01\", \"created_at\": \"2026-08-29T17:21:12+02:00\", \"action_taken\": \"published\"}], \"current_step\": 1}',1),(13,'csfac01','test10','zass','Academic','faculty','offline','a','2026-09-12','2026-09-12','10:00:00','17:00:00','2026-09-10 00:00:00',10,2000.00,'main cord','1233456782',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"sub_events\": [{\"name\": \"dance\", \"venue\": \"venue\", \"end_time\": \"12:00\", \"start_time\": \"11:00\", \"description\": \"a\", \"coordinator_name\": \"xyz cord\", \"max_participants\": \"10\", \"participation_type\": \"solo\"}, {\"name\": \"sing\", \"venue\": \"venue\", \"end_time\": \"14:00\", \"max_groups\": \"4\", \"start_time\": \"13:00\", \"description\": \"s\", \"max_team_size\": \"8\", \"coordinator_name\": \"cord\", \"max_participants\": \"\", \"participation_type\": \"group\"}], \"is_festival\": true, \"max_team_size\": 4, \"participation_type\": \"group\"}, \"brochure\": \"uploads/event_proposal_1788152394_6a950a4a44ba3.png\"}','published','{\"route\": [\"hod\", \"director\"], \"history\": [{\"notes\": \"\", \"user_id\": \"cshod01\", \"created_at\": \"2026-08-31T07:00:53+02:00\", \"action_taken\": \"pending_director\"}, {\"notes\": \"\", \"user_id\": \"director_scst\", \"created_at\": \"2026-08-31T07:08:10+02:00\", \"action_taken\": \"published\"}], \"current_step\": 2}',1),(14,'csfac01','Innovate 2026 — University Tech Fest','The flagship annual technology festival of GM University. Features competitive hackathons, paper presentations, robotics showcase, and guest lectures from industry leaders at ISRO, Google, and Infosys. Open to all departments.\n\nHighlights:\n• 24-Hour Hackathon with ₹50,000 prize pool\n• Paper presentation on AI, Cloud & Cybersecurity\n• Robotics war arena\n• Industry expert panel discussion','Academic','university','offline','GMU Main Auditorium & Open Arena, Block A','2026-10-15','2026-10-15','09:00:00','18:00:00','2026-10-10 00:00:00',500,75000.00,'Dr. Priya Menon','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Cash prizes, certificates, and goodies worth ₹80,000 total\", \"sub_events\": [{\"name\": \"24-Hour Hackathon\", \"description\": \"Build an innovative tech solution in 24 hours. Problem statements on Smart Cities, HealthTech, and FinTech.\", \"coordinator_name\": \"Rahul Sharma\", \"max_participants\": 120, \"coordinator_phone\": \"9123456780\", \"participation_type\": \"group\"}, {\"name\": \"Paper Presentation\", \"description\": \"Present original research on AI, ML, Cybersecurity, or Cloud Computing. Top papers get published in the university journal.\", \"coordinator_name\": \"Dr. Ananya Rao\", \"max_participants\": 80, \"coordinator_phone\": \"9234567891\", \"participation_type\": \"solo\"}, {\"name\": \"Robotics Arena\", \"description\": \"Design and program autonomous robots to complete challenges. Battle arena and maze solving rounds included.\", \"coordinator_name\": \"Kiran Desai\", \"max_participants\": 60, \"coordinator_phone\": \"9345678902\", \"participation_type\": \"group\"}], \"is_festival\": true, \"max_team_size\": 4, \"max_volunteers\": 50, \"participation_type\": \"group\"}, \"brochure\": \"uploads/event_proposal_innovate2026.pdf\"}','published','{\"route\": [\"hod\", \"director\"], \"history\": [{\"at\": \"2026-09-20 10:30:00\", \"role\": \"hod\", \"action\": \"approve\", \"remarks\": \"Excellent proposal. Approved.\"}, {\"at\": \"2026-09-22 14:15:00\", \"role\": \"director\", \"action\": \"approve\", \"remarks\": \"Fully approved. Proceed with logistics.\"}], \"current_step\": 2}',1),(15,'csfac01','Startup Pitch Challenge 2026','Got a business idea? Pitch it to a panel of investors, venture capitalists, and successful entrepreneurs. Teams of 2–5 members present a 10-minute pitch followed by a 5-minute Q&A. Top 3 teams win seed funding opportunities and mentorship sessions.\n\nWinner receives an incubation opportunity at GMU Innovation Hub with ₹25,000 seed support.','Academic','university','offline','GMU Seminar Hall, Block C, 3rd Floor','2026-11-08','2026-11-08','10:00:00','17:00:00','2026-11-01 00:00:00',100,30000.00,'Prof. Vikram Kulkarni','9456789013',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Incubation opportunity + ₹25,000 seed funding for winner. ₹10,000 and ₹5,000 for 2nd and 3rd.\", \"is_festival\": false, \"max_team_size\": 5, \"max_volunteers\": 15, \"participation_type\": \"group\"}, \"brochure\": \"uploads/event_proposal_startup_pitch.pdf\"}','published','{\"route\": [\"hod\", \"director\"], \"history\": [{\"at\": \"2026-09-25 11:00:00\", \"role\": \"hod\", \"action\": \"approve\", \"remarks\": \"Great initiative.\"}, {\"at\": \"2026-09-27 09:30:00\", \"role\": \"director\", \"action\": \"approve\", \"remarks\": \"Approved. Please coordinate with placement cell.\"}], \"current_step\": 2}',1),(16,'csfac01','National Cybersecurity Conclave 2026','A premier university-level event bringing together cybersecurity researchers, ethical hackers, and industry professionals. Features a live Capture the Flag (CTF) competition, keynote from CERT-In officials, and a workshop on zero-day vulnerability assessment.\n\nExpected participation from 12 colleges across Karnataka.','Academic','university','offline','GMU Convention Centre, Ground Floor','2026-12-05','2026-12-05','09:30:00','17:30:00','2026-11-28 00:00:00',300,55000.00,'Dr. Rohan Bhat','9567890124',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Trophy + Certificate + Cash prizes for CTF winners\", \"is_festival\": false, \"max_volunteers\": 25, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_proposal_cyber_conclave.pdf\"}','pending_director','{\"route\": [\"hod\", \"director\"], \"history\": [{\"at\": \"2026-10-02 10:00:00\", \"role\": \"hod\", \"action\": \"approve\", \"remarks\": \"Strongly recommended. Elevates department reputation.\"}], \"current_step\": 1}',0),(17,'csfac01','CSE Cultural Night — Galaxia 2026','The annual cultural extravaganza of the Department of Computer Science and Engineering. An evening of dance performances, music, stand-up comedy, skit, and fashion show. Open exclusively to CSE students and their guests.\n\nPast editions have attracted 400+ attendees. This year includes a surprise celebrity performance.','Cultural','department','offline','GMU Open Air Theatre','2026-11-20','2026-11-20','17:00:00','22:00:00','2026-11-15 00:00:00',400,40000.00,'Ms. Neha Joshi','9678901235',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Trophies and certificates for winning performances\", \"is_festival\": false, \"max_volunteers\": 30, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_proposal_galaxia_2026.pdf\"}','pending_hod','{\"route\": [\"hod\"], \"history\": [], \"current_step\": 0}',0),(18,'csfac01','Leadership & Communication Bootcamp','A three-day intensive bootcamp designed to build leadership, public speaking, and team management skills in students. Conducted by certified trainers from the Indian Institute of Management (IIM) Alumni Network.\n\nActivities included: group discussions, mock debates, crisis management simulations, and personality development sessions. 92% of participants reported improved confidence in post-event surveys.','Academic','university','offline','GMU Management Block, Seminar Rooms 101–104','2026-08-10','2026-08-10','08:30:00','17:00:00','2026-08-05 00:00:00',150,20000.00,'Dr. Kavitha Pillai','9789012346',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Certificate of completion for all participants. Merit certificates for top 10 performers.\", \"is_festival\": false, \"max_volunteers\": 10, \"participation_type\": \"solo\"}, \"gallery\": [\"uploads/gallery/lc_1.jpg\", \"uploads/gallery/lc_2.jpg\", \"uploads/gallery/lc_3.jpg\"], \"brochure\": \"uploads/event_proposal_leadership_bootcamp.pdf\", \"report_file\": \"uploads/reports/leadership_bootcamp_report.pdf\"}','completed','{\"route\": [\"hod\", \"director\"], \"history\": [{\"at\": \"2026-07-15 09:00:00\", \"role\": \"hod\", \"action\": \"approve\", \"remarks\": \"Well-structured proposal.\"}, {\"at\": \"2026-07-18 11:00:00\", \"role\": \"director\", \"action\": \"approve\", \"remarks\": \"Approved. Coordinate with alumni cell.\"}], \"current_step\": 2}',1),(19,'csfac01','Innovate 2026 ÔÇö University Tech Fest','The flagship annual technology festival of GM University. Features competitive hackathons, paper presentations, robotics showcase, and guest lectures from industry leaders at ISRO, Google, and Infosys. Open to all departments.\n\nHighlights:\nÔÇó 24-Hour Hackathon with Ôé╣50,000 prize pool\nÔÇó Paper presentation on AI, Cloud & Cybersecurity\nÔÇó Robotics war arena\nÔÇó Industry expert panel discussion','Academic','university','offline','GMU Main Auditorium & Open Arena, Block A','2026-10-15','2026-10-15','09:00:00','18:00:00','2026-10-10 00:00:00',500,75000.00,'Dr. Priya Menon','9876543210',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Cash prizes, certificates, and goodies worth Ôé╣80,000 total\", \"sub_events\": [{\"name\": \"24-Hour Hackathon\", \"description\": \"Build an innovative tech solution in 24 hours. Problem statements on Smart Cities, HealthTech, and FinTech.\", \"coordinator_name\": \"Rahul Sharma\", \"max_participants\": 120, \"coordinator_phone\": \"9123456780\", \"participation_type\": \"group\"}, {\"name\": \"Paper Presentation\", \"description\": \"Present original research on AI, ML, Cybersecurity, or Cloud Computing. Top papers get published in the university journal.\", \"coordinator_name\": \"Dr. Ananya Rao\", \"max_participants\": 80, \"coordinator_phone\": \"9234567891\", \"participation_type\": \"solo\"}, {\"name\": \"Robotics Arena\", \"description\": \"Design and program autonomous robots to complete challenges. Battle arena and maze solving rounds included.\", \"coordinator_name\": \"Kiran Desai\", \"max_participants\": 60, \"coordinator_phone\": \"9345678902\", \"participation_type\": \"group\"}], \"is_festival\": true, \"max_team_size\": 4, \"max_volunteers\": 50, \"participation_type\": \"group\"}, \"brochure\": \"uploads/event_proposal_innovate2026.pdf\"}','published','{\"route\": [\"hod\", \"director\"], \"history\": [{\"at\": \"2026-09-20 10:30:00\", \"role\": \"hod\", \"action\": \"approve\", \"remarks\": \"Excellent proposal. Approved.\"}, {\"at\": \"2026-09-22 14:15:00\", \"role\": \"director\", \"action\": \"approve\", \"remarks\": \"Fully approved. Proceed with logistics.\"}], \"current_step\": 2}',1),(20,'csfac01','Startup Pitch Challenge 2026','Got a business idea? Pitch it to a panel of investors, venture capitalists, and successful entrepreneurs. Teams of 2ÔÇô5 members present a 10-minute pitch followed by a 5-minute Q&A. Top 3 teams win seed funding opportunities and mentorship sessions.\n\nWinner receives an incubation opportunity at GMU Innovation Hub with Ôé╣25,000 seed support.','Academic','university','offline','GMU Seminar Hall, Block C, 3rd Floor','2026-11-08','2026-11-08','10:00:00','17:00:00','2026-11-01 00:00:00',100,30000.00,'Prof. Vikram Kulkarni','9456789013',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Incubation opportunity + Ôé╣25,000 seed funding for winner. Ôé╣10,000 and Ôé╣5,000 for 2nd and 3rd.\", \"is_festival\": false, \"max_team_size\": 5, \"max_volunteers\": 15, \"participation_type\": \"group\"}, \"brochure\": \"uploads/event_proposal_startup_pitch.pdf\"}','published','{\"route\": [\"hod\", \"director\"], \"history\": [{\"at\": \"2026-09-25 11:00:00\", \"role\": \"hod\", \"action\": \"approve\", \"remarks\": \"Great initiative.\"}, {\"at\": \"2026-09-27 09:30:00\", \"role\": \"director\", \"action\": \"approve\", \"remarks\": \"Approved. Please coordinate with placement cell.\"}], \"current_step\": 2}',1),(21,'csfac01','National Cybersecurity Conclave 2026','A premier university-level event bringing together cybersecurity researchers, ethical hackers, and industry professionals. Features a live Capture the Flag (CTF) competition, keynote from CERT-In officials, and a workshop on zero-day vulnerability assessment.\n\nExpected participation from 12 colleges across Karnataka.','Academic','university','offline','GMU Convention Centre, Ground Floor','2026-12-05','2026-12-05','09:30:00','17:30:00','2026-11-28 00:00:00',300,55000.00,'Dr. Rohan Bhat','9567890124',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Trophy + Certificate + Cash prizes for CTF winners\", \"is_festival\": false, \"max_volunteers\": 25, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_proposal_cyber_conclave.pdf\"}','pending_director','{\"route\": [\"hod\", \"director\"], \"history\": [{\"at\": \"2026-10-02 10:00:00\", \"role\": \"hod\", \"action\": \"approve\", \"remarks\": \"Strongly recommended. Elevates department reputation.\"}], \"current_step\": 1}',0),(22,'csfac01','CSE Cultural Night ÔÇö Galaxia 2026','The annual cultural extravaganza of the Department of Computer Science and Engineering. An evening of dance performances, music, stand-up comedy, skit, and fashion show. Open exclusively to CSE students and their guests.\n\nPast editions have attracted 400+ attendees. This year includes a surprise celebrity performance.','Cultural','department','offline','GMU Open Air Theatre','2026-11-20','2026-11-20','17:00:00','22:00:00','2026-11-15 00:00:00',400,40000.00,'Ms. Neha Joshi','9678901235',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Trophies and certificates for winning performances\", \"is_festival\": false, \"max_volunteers\": 30, \"participation_type\": \"solo\"}, \"brochure\": \"uploads/event_proposal_galaxia_2026.pdf\"}','pending_hod','{\"route\": [\"hod\"], \"history\": [], \"current_step\": 0}',0),(23,'csfac01','Leadership & Communication Bootcamp','A three-day intensive bootcamp designed to build leadership, public speaking, and team management skills in students. Conducted by certified trainers from the Indian Institute of Management (IIM) Alumni Network.\n\nActivities included: group discussions, mock debates, crisis management simulations, and personality development sessions. 92% of participants reported improved confidence in post-event surveys.','Academic','university','offline','GMU Management Block, Seminar Rooms 101ÔÇô104','2026-08-10','2026-08-10','08:30:00','17:00:00','2026-08-05 00:00:00',150,20000.00,'Dr. Kavitha Pillai','9789012346',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"details\": {\"rewards\": \"Certificate of completion for all participants. Merit certificates for top 10 performers.\", \"is_festival\": false, \"max_volunteers\": 10, \"participation_type\": \"solo\"}, \"gallery\": [\"uploads/gallery/lc_1.jpg\", \"uploads/gallery/lc_2.jpg\", \"uploads/gallery/lc_3.jpg\"], \"brochure\": \"uploads/event_proposal_leadership_bootcamp.pdf\", \"report_file\": \"uploads/reports/leadership_bootcamp_report.pdf\"}','completed','{\"route\": [\"hod\", \"director\"], \"history\": [{\"at\": \"2026-07-15 09:00:00\", \"role\": \"hod\", \"action\": \"approve\", \"remarks\": \"Well-structured proposal.\"}, {\"at\": \"2026-07-18 11:00:00\", \"role\": \"director\", \"action\": \"approve\", \"remarks\": \"Approved. Coordinate with alumni cell.\"}], \"current_step\": 2}',1);
/*!40000 ALTER TABLE `event_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_registrations`
--

DROP TABLE IF EXISTS `event_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_registrations` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_registrations`
--

LOCK TABLES `event_registrations` WRITE;
/*!40000 ALTER TABLE `event_registrations` DISABLE KEYS */;
INSERT INTO `event_registrations` VALUES (1,'3','gmcs01',NULL,'participant','2026-08-27 14:14:25','pending',NULL,'EVT-3-STU-gmcs01-6a8ff8e90bf4a',NULL,NULL,'gmcs01',NULL,NULL),(2,'5','gmcs01',NULL,'participant','2026-08-27 18:04:21','pending',NULL,'EVT-5-STU-gmcs01-6a902ecd29817',NULL,NULL,'gmcs01',NULL,NULL),(3,'12','gmcs01',NULL,'participant','2026-08-29 20:51:51','pending',NULL,'EVT-12-STU-gmcs01-6a92f90f3ce36',NULL,NULL,'gmcs01',NULL,NULL),(4,'6','gmcs01',NULL,'participant','2026-08-29 23:23:59','pending',NULL,'EVT-6-STU-gmcs01-6a931cb7d1b80',NULL,NULL,'gmcs01',NULL,NULL);
/*!40000 ALTER TABLE `event_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `USERNAME` varchar(50) NOT NULL,
  `EMAIL` varchar(191) DEFAULT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `NAME` varchar(100) NOT NULL,
  `SEMESTER` varchar(50) DEFAULT NULL,
  `ROLE` varchar(50) NOT NULL,
  `DEPT` varchar(100) DEFAULT NULL,
  `FACULTY` varchar(100) DEFAULT NULL,
  `SCHOOL` varchar(200) DEFAULT NULL,
  `fcm_web_token` varchar(500) DEFAULT NULL COMMENT 'Firebase Cloud Messaging web push token',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `USERNAME` (`USERNAME`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'gmcs01','gmcs01@gmu.ac.in','pass123','Aarav Sharma','3rd','student','CSE','FET','SCST','cQy34AjtFIeyvirtKt5ijV:APA91bHeWWkIGLgwWKq3Uks9UPwG3MvIHHXy_f5xMAGqkUO2UQqlNQfM84-1T3wLoIO60pqtz9mgsKd4qbyCw1PZo3ixoEbrJxTWqYwf6O49fUcv58UP7DM'),(2,'csfac01','csfac01@gmu.ac.in','pass123','Prof. Alice CSE',NULL,'faculty','CSE','FET','SCST','cPzudrx0Qald-9w0U4wIWj:APA91bEndr69TVbtorSolrKHkLW44zs3txsk6fEBGaCplOoFQcSjg9UBreNpZEJgDNPMtWzeHYUgTpYHBaLc0T-TFrVFtReI7KAOVSEMIffkOg_KSE3SPo0'),(3,'cshod01','cshod01@gmu.ac.in','pass123','Dr. HOD CSE',NULL,'hod','CSE','FET','SCST','cPzudrx0Qald-9w0U4wIWj:APA91bEndr69TVbtorSolrKHkLW44zs3txsk6fEBGaCplOoFQcSjg9UBreNpZEJgDNPMtWzeHYUgTpYHBaLc0T-TFrVFtReI7KAOVSEMIffkOg_KSE3SPo0'),(4,'aihod01','aihod01@gmu.ac.in','pass123','Dr. HOD AIML',NULL,'hod','AIML','FET','SCST',NULL),(5,'director_scst','director_scst@gmu.ac.in','pass123','Director SCST',NULL,'director','CSE','FET','SCST','cPzudrx0Qald-9w0U4wIWj:APA91bEndr69TVbtorSolrKHkLW44zs3txsk6fEBGaCplOoFQcSjg9UBreNpZEJgDNPMtWzeHYUgTpYHBaLc0T-TFrVFtReI7KAOVSEMIffkOg_KSE3SPo0'),(6,'director_sa','director_sa@gmu.ac.in','pass123','Director Student Affairs',NULL,'student_affairs','Student Affairs','Administration','Administration',NULL),(7,'dean_fet','dean_fet@gmu.ac.in','pass123','Dean FET',NULL,'dean','Administration','FET','SCST',NULL),(8,'pro_vc','pro_vc@gmu.ac.in','pass123','Pro Vice Chancellor',NULL,'provc','Administration','FET','SCST',NULL),(9,'vc','vc@gmu.ac.in','pass123','Vice Chancellor',NULL,'vc','Administration','FET','SCST',NULL),(10,'vol01','vol01@gmu.ac.in','pass123','Volunteer CSE',NULL,'volunteer','CSE','FET','SCST',NULL),(11,'events_admin','events_admin@gmu.ac.in','pass123','Events Admin',NULL,'events_admin','Events Management','Administration','Administration',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-31 12:33:03
