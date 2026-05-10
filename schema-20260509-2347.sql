-- MySQL dump 10.13  Distrib 9.6.0, for macos14.8 (arm64)
--
-- Host: mainline.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

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
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `updated_at` datetime NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assigned_workout`
--

DROP TABLE IF EXISTS `assigned_workout`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assigned_workout` (
  `assigned_workout_id` int NOT NULL AUTO_INCREMENT,
  `coach_user_id` int NOT NULL,
  `client_user_id` int NOT NULL,
  `workout_id` int NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `due_date` date DEFAULT NULL,
  `status` enum('assigned','completed','skipped') NOT NULL DEFAULT 'assigned',
  `completed_at` datetime DEFAULT NULL,
  `coach_notes` text,
  PRIMARY KEY (`assigned_workout_id`),
  KEY `workout_id` (`workout_id`),
  KEY `idx_client_status` (`client_user_id`,`status`),
  KEY `idx_coach_assigned` (`coach_user_id`,`assigned_at`),
  CONSTRAINT `assigned_workout_ibfk_1` FOREIGN KEY (`coach_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `assigned_workout_ibfk_2` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `assigned_workout_ibfk_3` FOREIGN KEY (`workout_id`) REFERENCES `workout` (`workout_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calendar_event`
--

DROP TABLE IF EXISTS `calendar_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_event` (
  `calendar_event_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date NOT NULL,
  `text` varchar(255) NOT NULL,
  `color` varchar(20) NOT NULL DEFAULT '#6ca6ff',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`calendar_event_id`),
  KEY `idx_calendar_user_date` (`user_id`,`date`),
  CONSTRAINT `fk_calendar_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calorie_targets`
--

DROP TABLE IF EXISTS `calorie_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calorie_targets` (
  `target_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `weekly_target` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`target_id`),
  UNIQUE KEY `unique_active_calorie_target` (`user_id`,((case when (`end_date` is null) then 1 else NULL end))),
  CONSTRAINT `calorie_targets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cardio_log_detail`
--

DROP TABLE IF EXISTS `cardio_log_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cardio_log_detail` (
  `cardio_log_id` int NOT NULL AUTO_INCREMENT,
  `workout_log_id` int NOT NULL,
  `exercise_id` int NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `distance_km` decimal(6,2) DEFAULT NULL,
  `avg_heart_rate` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cardio_log_id`),
  KEY `idx_cld_workout_log` (`workout_log_id`),
  KEY `idx_cld_exercise` (`exercise_id`),
  CONSTRAINT `fk_cld_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercise` (`exercise_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_cld_workout_log` FOREIGN KEY (`workout_log_id`) REFERENCES `workout_log` (`workout_log_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client` (
  `user_id` int NOT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `goal_weight` decimal(5,2) DEFAULT NULL,
  `goal` varchar(255) DEFAULT NULL,
  `type_workout` varchar(255) DEFAULT NULL,
  `diet_preference` varchar(255) DEFAULT NULL,
  `current_activity` varchar(255) DEFAULT NULL,
  `coach_help` varchar(255) DEFAULT NULL,
  `nutritionist_help` varchar(255) DEFAULT NULL,
  `workout_day` int DEFAULT NULL,
  `survey_completed` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_client_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client_coach_relationship`
--

DROP TABLE IF EXISTS `client_coach_relationship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_coach_relationship` (
  `client_coach_relationship_id` int NOT NULL AUTO_INCREMENT,
  `client_user_id` int NOT NULL,
  `coach_user_id` int NOT NULL,
  `status` enum('active','inactive','pending') NOT NULL DEFAULT 'pending',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `responded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`client_coach_relationship_id`),
  UNIQUE KEY `uq_ccr_client_coach` (`client_user_id`,`coach_user_id`),
  KEY `idx_ccr_client` (`client_user_id`),
  KEY `idx_ccr_coach` (`coach_user_id`),
  CONSTRAINT `fk_ccr_client_test_1` FOREIGN KEY (`client_user_id`) REFERENCES `client` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ccr_coach_test_1` FOREIGN KEY (`coach_user_id`) REFERENCES `coach` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `client_nutritionist_relationship`
--

DROP TABLE IF EXISTS `client_nutritionist_relationship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_nutritionist_relationship` (
  `client_user_id` int NOT NULL,
  `nutritionist_user_id` int NOT NULL,
  `status` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`client_user_id`,`nutritionist_user_id`),
  KEY `fk_cnr_nutritionist` (`nutritionist_user_id`),
  CONSTRAINT `fk_cnr_client` FOREIGN KEY (`client_user_id`) REFERENCES `client` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cnr_nutritionist` FOREIGN KEY (`nutritionist_user_id`) REFERENCES `nutritionist` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coach`
--

DROP TABLE IF EXISTS `coach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach` (
  `user_id` int NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bio` text,
  `experience_years` int DEFAULT '0',
  `is_approved` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_coach_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coach_availability_rule`
--

DROP TABLE IF EXISTS `coach_availability_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach_availability_rule` (
  `rule_id` int NOT NULL AUTO_INCREMENT,
  `coach_user_id` int NOT NULL,
  `day_of_week` tinyint NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration_minutes` int NOT NULL DEFAULT '60',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`),
  KEY `idx_rule_coach_active` (`coach_user_id`,`is_active`),
  KEY `idx_rule_day` (`coach_user_id`,`day_of_week`),
  CONSTRAINT `fk_avail_rule_coach` FOREIGN KEY (`coach_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coach_certification`
--

DROP TABLE IF EXISTS `coach_certification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach_certification` (
  `certification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `document_url` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`certification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coach_note`
--

DROP TABLE IF EXISTS `coach_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach_note` (
  `coach_note_id` int NOT NULL AUTO_INCREMENT,
  `coach_user_id` int NOT NULL,
  `client_user_id` int NOT NULL,
  `note` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`coach_note_id`),
  KEY `client_user_id` (`client_user_id`),
  KEY `idx_coach_client` (`coach_user_id`,`client_user_id`,`created_at`),
  CONSTRAINT `coach_note_ibfk_1` FOREIGN KEY (`coach_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `coach_note_ibfk_2` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coach_review`
--

DROP TABLE IF EXISTS `coach_review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach_review` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `coach_user_id` int NOT NULL,
  `client_user_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `uq_cr_coach_client` (`coach_user_id`,`client_user_id`),
  KEY `fk_cr_client` (`client_user_id`),
  CONSTRAINT `fk_cr_client` FOREIGN KEY (`client_user_id`) REFERENCES `client` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cr_coach` FOREIGN KEY (`coach_user_id`) REFERENCES `coach` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_cr_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coaching_plan`
--

DROP TABLE IF EXISTS `coaching_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coaching_plan` (
  `plan_id` int NOT NULL AUTO_INCREMENT,
  `coach_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `plan_duration` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan_id`),
  KEY `idx_cp_coach` (`coach_id`),
  CONSTRAINT `fk_cp_coach_user` FOREIGN KEY (`coach_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_checkins`
--

DROP TABLE IF EXISTS `daily_checkins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_checkins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date NOT NULL,
  `stress_level` int NOT NULL,
  `motivation_level` int NOT NULL,
  `energy_level` int NOT NULL,
  `sleep_quality` int NOT NULL,
  `body_quality` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `mood_level` int NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_id`,`date`),
  CONSTRAINT `daily_checkins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `chk_energy` CHECK ((`energy_level` between 1 and 10)),
  CONSTRAINT `chk_mood` CHECK ((`mood_level` between 1 and 6)),
  CONSTRAINT `chk_motivation` CHECK ((`motivation_level` between 1 and 10)),
  CONSTRAINT `chk_stress` CHECK ((`stress_level` between 1 and 10))
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercise`
--

DROP TABLE IF EXISTS `exercise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise` (
  `exercise_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` enum('strength','cardio') NOT NULL,
  `equipment` varchar(100) DEFAULT NULL,
  `pirmary_muscles` varchar(100) DEFAULT NULL,
  `instructions` varchar(100) DEFAULT NULL,
  `video_url` text,
  `image_url` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`exercise_id`),
  UNIQUE KEY `exercise_un` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meal`
--

DROP TABLE IF EXISTS `meal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `calories_per_serving` float NOT NULL,
  `protein` float DEFAULT NULL,
  `carbs` float DEFAULT NULL,
  `fat` float DEFAULT NULL,
  `is_premade` tinyint(1) DEFAULT '0',
  `created_by_user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fiber` float DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_meal_creator` (`created_by_user_id`),
  KEY `idx_meal_premade` (`is_premade`),
  CONSTRAINT `fk_meals_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meal_logs`
--

DROP TABLE IF EXISTS `meal_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `meal_id` int NOT NULL,
  `date` date NOT NULL,
  `servings` float NOT NULL,
  `calories_consumed` float NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_meallogs_meal` (`meal_id`),
  KEY `idx_meallogs_user_date` (`user_id`,`date`),
  CONSTRAINT `fk_meallogs_meal` FOREIGN KEY (`meal_id`) REFERENCES `meal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meallogs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meal_plan`
--

DROP TABLE IF EXISTS `meal_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_plan` (
  `meal_plan_id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `created_by_user_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`meal_plan_id`),
  KEY `idx_meal_plan_client` (`client_id`),
  KEY `idx_meal_plan_created_by` (`created_by_user_id`),
  CONSTRAINT `fk_meal_plan_client` FOREIGN KEY (`client_id`) REFERENCES `client` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_meal_plan_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meal_plan_items`
--

DROP TABLE IF EXISTS `meal_plan_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_plan_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meal_plan_id` int NOT NULL,
  `meal_id` int NOT NULL,
  `day_number` int NOT NULL,
  `meal_time` enum('breakfast','lunch','dinner','snack') NOT NULL,
  `servings` float DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `meal_plan_id` (`meal_plan_id`,`day_number`,`meal_time`),
  KEY `idx_mpi_plan` (`meal_plan_id`),
  KEY `idx_mpi_meal` (`meal_id`),
  CONSTRAINT `fk_mpi_meal` FOREIGN KEY (`meal_id`) REFERENCES `meal` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mpi_plan` FOREIGN KEY (`meal_plan_id`) REFERENCES `meal_plan` (`meal_plan_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `from_id` int NOT NULL,
  `to_id` int NOT NULL,
  `message_content` text NOT NULL,
  `message_type` varchar(20) NOT NULL DEFAULT 'text',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_msg_to_read` (`to_id`,`is_read`,`created_at`),
  KEY `idx_msg_pair_time` (`from_id`,`to_id`,`created_at`),
  CONSTRAINT `fk_msg_from` FOREIGN KEY (`from_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_msg_to` FOREIGN KEY (`to_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_msg_type` CHECK ((`message_type` in (_utf8mb4'text',_utf8mb4'image',_utf8mb4'file')))
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `recipient_user_id` int NOT NULL,
  `actor_user_id` int DEFAULT NULL,
  `for_role` enum('client','coach','nutritionist') NOT NULL,
  `type` enum('coach_request_received','coach_request_approved','coach_request_rejected','workout_assigned','workout_completed','client_unhired','coach_dropped_client','progress_photo_uploaded','session_package_purchased','session_booked') NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` varchar(500) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `related_id` int DEFAULT NULL,
  `related_type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_recipient_role_unread` (`recipient_user_id`,`for_role`,`is_read`,`created_at` DESC),
  KEY `idx_recipient_created` (`recipient_user_id`,`created_at` DESC),
  KEY `fk_notification_actor` (`actor_user_id`),
  CONSTRAINT `fk_notification_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notification_recipient` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nutrition_plan`
--

DROP TABLE IF EXISTS `nutrition_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nutrition_plan` (
  `plan_id` int NOT NULL AUTO_INCREMENT,
  `nutritionist_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `plan_duration` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan_id`),
  KEY `idx_np_nutritionist` (`nutritionist_id`),
  CONSTRAINT `fk_np_nutritionist_user` FOREIGN KEY (`nutritionist_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nutritionist`
--

DROP TABLE IF EXISTS `nutritionist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nutritionist` (
  `user_id` int NOT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_approved` tinyint(1) NOT NULL DEFAULT '0',
  `description` text,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_nutritionist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nutritionist_review`
--

DROP TABLE IF EXISTS `nutritionist_review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nutritionist_review` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `nutritionist_user_id` int NOT NULL,
  `client_user_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `uq_nr_nutritionist_client` (`nutritionist_user_id`,`client_user_id`),
  KEY `fk_nr_client` (`client_user_id`),
  CONSTRAINT `fk_nr_client` FOREIGN KEY (`client_user_id`) REFERENCES `client` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nr_nutritionist` FOREIGN KEY (`nutritionist_user_id`) REFERENCES `nutritionist` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_nr_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `coach_id` int DEFAULT NULL,
  `nutritionist_id` int DEFAULT NULL,
  `package_id` int DEFAULT NULL,
  `coaching_plan_id` int DEFAULT NULL,
  `nutrition_plan_id` int DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `payment_method` varchar(20) NOT NULL,
  `payment_amount` decimal(10,2) NOT NULL,
  `payment_date` datetime NOT NULL,
  `payment_status` varchar(20) NOT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `idx_pay_client` (`client_id`),
  KEY `idx_pay_coach` (`coach_id`),
  KEY `idx_pay_nutritionist` (`nutritionist_id`),
  KEY `fk_pay_package` (`package_id`),
  KEY `fk_pay_coaching_plan` (`coaching_plan_id`),
  KEY `fk_pay_nutrition_plan` (`nutrition_plan_id`),
  CONSTRAINT `fk_pay_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pay_coach` FOREIGN KEY (`coach_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pay_coaching_plan` FOREIGN KEY (`coaching_plan_id`) REFERENCES `coaching_plan` (`plan_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pay_nutrition_plan` FOREIGN KEY (`nutrition_plan_id`) REFERENCES `nutrition_plan` (`plan_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pay_nutritionist` FOREIGN KEY (`nutritionist_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pay_package` FOREIGN KEY (`package_id`) REFERENCES `session_package` (`package_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_payment_method` CHECK ((`payment_method` in (_utf8mb4'card',_utf8mb4'cash',_utf8mb4'bank_transfer'))),
  CONSTRAINT `chk_payment_status` CHECK ((`payment_status` in (_utf8mb4'pending',_utf8mb4'completed',_utf8mb4'failed',_utf8mb4'refunded')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `progress_photo`
--

DROP TABLE IF EXISTS `progress_photo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `progress_photo` (
  `photo_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `image_data` mediumtext NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `taken_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`photo_id`),
  KEY `idx_progress_user_date` (`user_id`,`taken_date` DESC),
  CONSTRAINT `fk_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `coach_id` int NOT NULL,
  `client_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_session_coach_time` (`coach_id`,`scheduled_at`),
  KEY `idx_session_client_time` (`client_id`,`scheduled_at`),
  KEY `fk_session_payment` (`payment_id`),
  CONSTRAINT `fk_session_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_session_coach` FOREIGN KEY (`coach_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_session_payment` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`payment_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_session_status` CHECK ((`status` in (_utf8mb4'scheduled',_utf8mb4'completed',_utf8mb4'cancelled',_utf8mb4'no_show')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session_booking`
--

DROP TABLE IF EXISTS `session_booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_booking` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `rule_id` int DEFAULT NULL,
  `coach_user_id` int NOT NULL,
  `client_user_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_minutes` int NOT NULL,
  `status` enum('confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'confirmed',
  `client_notes` text,
  `coach_notes` text,
  `cancelled_by` enum('client','coach') DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `booked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`booking_id`),
  UNIQUE KEY `uq_coach_starttime` (`coach_user_id`,`start_time`),
  KEY `fk_booking_purchase` (`purchase_id`),
  KEY `fk_booking_rule` (`rule_id`),
  KEY `idx_booking_coach_time` (`coach_user_id`,`start_time`),
  KEY `idx_booking_client_status` (`client_user_id`,`status`),
  CONSTRAINT `fk_booking_client` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_booking_coach` FOREIGN KEY (`coach_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_booking_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `session_purchase` (`purchase_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_booking_rule` FOREIGN KEY (`rule_id`) REFERENCES `coach_availability_rule` (`rule_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session_package`
--

DROP TABLE IF EXISTS `session_package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_package` (
  `package_id` int NOT NULL AUTO_INCREMENT,
  `coach_user_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `session_count` int NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`package_id`),
  KEY `idx_sp_coach` (`coach_user_id`),
  CONSTRAINT `fk_sp_coach_user` FOREIGN KEY (`coach_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session_purchase`
--

DROP TABLE IF EXISTS `session_purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_purchase` (
  `purchase_id` int NOT NULL AUTO_INCREMENT,
  `client_user_id` int NOT NULL,
  `coach_user_id` int NOT NULL,
  `package_id` int DEFAULT NULL,
  `payment_id` int DEFAULT NULL,
  `total_sessions` int NOT NULL,
  `sessions_remaining` int NOT NULL,
  `total_price_snapshot` decimal(10,2) NOT NULL,
  `status` enum('active','exhausted','refunded','cancelled') NOT NULL DEFAULT 'active',
  `purchased_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`purchase_id`),
  KEY `fk_purchase_package` (`package_id`),
  KEY `fk_purchase_payment` (`payment_id`),
  KEY `idx_purchase_client_status` (`client_user_id`,`status`),
  KEY `idx_purchase_coach` (`coach_user_id`),
  CONSTRAINT `fk_purchase_client` FOREIGN KEY (`client_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchase_coach` FOREIGN KEY (`coach_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchase_package` FOREIGN KEY (`package_id`) REFERENCES `session_package` (`package_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_purchase_payment` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`payment_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `strength_log_detail`
--

DROP TABLE IF EXISTS `strength_log_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `strength_log_detail` (
  `strength_log_id` int NOT NULL AUTO_INCREMENT,
  `workout_log_id` int DEFAULT NULL,
  `exercise_id` int NOT NULL,
  `sets` int NOT NULL,
  `reps` int NOT NULL,
  `weight_lbs` decimal(6,2) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`strength_log_id`),
  KEY `idx_sld_workout_log` (`workout_log_id`),
  KEY `idx_sld_exercise` (`exercise_id`),
  CONSTRAINT `fk_sld_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercise` (`exercise_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sld_workout_log` FOREIGN KEY (`workout_log_id`) REFERENCES `workout_log` (`workout_log_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscription`
--

DROP TABLE IF EXISTS `subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription` (
  `subscription_id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `coach_id` int NOT NULL,
  `coaching_plan_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`subscription_id`),
  KEY `idx_sub_client` (`client_id`),
  KEY `idx_sub_coach` (`coach_id`),
  KEY `fk_sub_plan` (`coaching_plan_id`),
  KEY `fk_sub_payment` (`payment_id`),
  CONSTRAINT `fk_sub_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_coach` FOREIGN KEY (`coach_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_payment` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`payment_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_plan` FOREIGN KEY (`coaching_plan_id`) REFERENCES `coaching_plan` (`plan_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_sub_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'expired',_utf8mb4'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('client','coach','nutritionist','admin') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `google_id` varchar(255) DEFAULT NULL,
  `profile_pic` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `google_id` (`google_id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wellness_logs`
--

DROP TABLE IF EXISTS `wellness_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wellness_logs` (
  `wl_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date NOT NULL,
  `water_intake_oz` int DEFAULT '0',
  `sleep_hours` decimal(4,2) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `steps` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`wl_id`),
  UNIQUE KEY `user_id` (`user_id`,`date`),
  CONSTRAINT `fk_wellness_client` FOREIGN KEY (`user_id`) REFERENCES `client` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workout`
--

DROP TABLE IF EXISTS `workout`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout` (
  `workout_id` int NOT NULL AUTO_INCREMENT,
  `created_by_user_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` varchar(250) DEFAULT NULL,
  `estimated_minutes` int NOT NULL,
  PRIMARY KEY (`workout_id`),
  KEY `idx_workout_created_by` (`created_by_user_id`),
  CONSTRAINT `fk_workout_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workout_exercise`
--

DROP TABLE IF EXISTS `workout_exercise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_exercise` (
  `workout_exercise_id` int NOT NULL AUTO_INCREMENT,
  `workout_id` int DEFAULT NULL,
  `exercise_id` int DEFAULT NULL,
  `sets` int NOT NULL,
  `reps` int NOT NULL,
  `rest_seconds` int DEFAULT NULL,
  `order_index` int NOT NULL,
  `notes` text,
  PRIMARY KEY (`workout_exercise_id`),
  KEY `idx_wx_workout` (`workout_id`),
  KEY `idx_wx_exercise` (`exercise_id`),
  CONSTRAINT `fk_wx_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercise` (`exercise_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_wx_workout` FOREIGN KEY (`workout_id`) REFERENCES `workout` (`workout_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workout_log`
--

DROP TABLE IF EXISTS `workout_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_log` (
  `workout_log_id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `workout_id` int NOT NULL,
  `date` date NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`workout_log_id`),
  KEY `idx_wl_client_date` (`client_id`,`date`),
  KEY `idx_wl_workout` (`workout_id`),
  CONSTRAINT `fk_wl_client` FOREIGN KEY (`client_id`) REFERENCES `client` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wl_workout` FOREIGN KEY (`workout_id`) REFERENCES `workout` (`workout_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workout_plan`
--

DROP TABLE IF EXISTS `workout_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_plan` (
  `workout_plan_id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `created_by_user_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`workout_plan_id`),
  KEY `idx_workout_plan_client` (`client_id`),
  KEY `idx_workout_plan_created_by` (`created_by_user_id`),
  CONSTRAINT `fk_workout_plan_client` FOREIGN KEY (`client_id`) REFERENCES `client` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_workout_plan_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-09 23:48:29
