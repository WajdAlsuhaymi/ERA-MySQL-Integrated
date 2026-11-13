-- ERA - MySQL 8.0.16+ database schema
-- Aligned with Phase 3 diagrams and instructor feedback.
-- Seven conceptual tables: no physical User supertype table (total/disjoint specialization).
-- A booking always reserves ONE seat. No numberOfParticipants column.
-- Activity.availableCapacity = REMAINING seats, not original total capacity.
-- DigitalStamp.activityID is intentionally omitted: Activity is reached through Booking.
-- API must use parameterized queries, hashed passwords (bcrypt cost >= 12), and HTTPS.
-- IMPORTANT: This script creates database structures; it does not connect your React app.

CREATE DATABASE IF NOT EXISTS era_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE era_db;

CREATE TABLE IF NOT EXISTS Customer (
  userID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  CONSTRAINT uq_customer_username UNIQUE (username),
  CONSTRAINT uq_customer_email UNIQUE (email),
  CONSTRAINT chk_customer_name CHECK (CHAR_LENGTH(TRIM(fullName)) > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ServiceProvider (
  userID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  CONSTRAINT uq_provider_username UNIQUE (username),
  CONSTRAINT uq_provider_email UNIQUE (email),
  CONSTRAINT chk_provider_name CHECK (CHAR_LENGTH(TRIM(fullName)) > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Activity (
  activityID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  providerID INT UNSIGNED NOT NULL,
  activityName VARCHAR(150) NOT NULL,
  type ENUM('Sport', 'Wellness', 'Entertainment') NOT NULL,
  description TEXT NOT NULL,
  destination VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  availableCapacity INT UNSIGNED NOT NULL,
  -- Implementation extensions used by ERA's existing React UI:
  image VARCHAR(500) NULL,
  imageAlt VARCHAR(255) NULL,
  isDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_activity_provider FOREIGN KEY (providerID)
    REFERENCES ServiceProvider(userID) ON DELETE RESTRICT,
  CONSTRAINT chk_activity_name CHECK (CHAR_LENGTH(TRIM(activityName)) > 0),
  INDEX idx_activity_visible (isDeleted, `date`, type),
  INDEX idx_activity_destination (destination),
  INDEX idx_activity_provider (providerID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Booking (
  bookingID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customerID INT UNSIGNED NOT NULL,
  activityID INT UNSIGNED NOT NULL,
  bookingDate DATE NOT NULL DEFAULT (CURRENT_DATE()),
  status ENUM('Confirmed', 'Completed') NOT NULL DEFAULT 'Confirmed',
  CONSTRAINT fk_booking_customer FOREIGN KEY (customerID)
    REFERENCES Customer(userID) ON DELETE RESTRICT,
  CONSTRAINT fk_booking_activity FOREIGN KEY (activityID)
    REFERENCES Activity(activityID) ON DELETE RESTRICT,
  INDEX idx_booking_activity_status (activityID, status),
  INDEX idx_booking_customer (customerID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DigitalTicket (
  ticketID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bookingID INT UNSIGNED NOT NULL,
  ticketCode VARCHAR(100) NOT NULL,
  issuedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_ticket_booking UNIQUE (bookingID),
  CONSTRAINT uq_ticket_code UNIQUE (ticketCode),
  CONSTRAINT fk_ticket_booking FOREIGN KEY (bookingID)
    REFERENCES Booking(bookingID) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DigitalActivityPassport (
  passportID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customerID INT UNSIGNED NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_passport_customer UNIQUE (customerID),
  CONSTRAINT fk_passport_customer FOREIGN KEY (customerID)
    REFERENCES Customer(userID) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS DigitalStamp (
  stampID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  passportID INT UNSIGNED NOT NULL,
  bookingID INT UNSIGNED NOT NULL,
  awardedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_stamp_booking UNIQUE (bookingID),
  CONSTRAINT fk_stamp_passport FOREIGN KEY (passportID)
    REFERENCES DigitalActivityPassport(passportID) ON DELETE CASCADE,
  CONSTRAINT fk_stamp_booking FOREIGN KEY (bookingID)
    REFERENCES Booking(bookingID) ON DELETE RESTRICT,
  INDEX idx_stamp_passport (passportID)
) ENGINE=InnoDB;

-- MySQL-side business rules. InnoDB makes each triggering statement atomic.
-- Creating a customer automatically creates exactly one passport.
-- Making a booking atomically decrements ONE remaining seat and generates ONE ticket.
-- The app must not also decrement availableCapacity or generate a duplicate ticket.
-- Changing Confirmed -> Completed automatically awards one digital stamp.
-- A provider cannot soft-delete an activity with any Confirmed booking.

DROP TRIGGER IF EXISTS trg_customer_create_passport;
DROP TRIGGER IF EXISTS trg_activity_no_delete_if_booked;
DROP TRIGGER IF EXISTS trg_booking_reserve_one_seat;
DROP TRIGGER IF EXISTS trg_booking_create_ticket;
DROP TRIGGER IF EXISTS trg_booking_award_stamp;
DROP TRIGGER IF EXISTS trg_stamp_validate_owner;

DELIMITER $$

CREATE TRIGGER trg_customer_create_passport
AFTER INSERT ON Customer
FOR EACH ROW
BEGIN
  INSERT INTO DigitalActivityPassport (customerID) VALUES (NEW.userID);
END$$

CREATE TRIGGER trg_activity_no_delete_if_booked
BEFORE UPDATE ON Activity
FOR EACH ROW
BEGIN
  IF OLD.isDeleted = FALSE AND NEW.isDeleted = TRUE AND EXISTS (
    SELECT 1 FROM Booking b
    WHERE b.activityID = OLD.activityID AND b.status = 'Confirmed'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot delete an activity with active bookings.';
  END IF;
END$$

CREATE TRIGGER trg_booking_reserve_one_seat
BEFORE INSERT ON Booking
FOR EACH ROW
BEGIN
  IF NEW.status <> 'Confirmed' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'A new booking must start as Confirmed.';
  END IF;
  UPDATE Activity
  SET availableCapacity = availableCapacity - 1
  WHERE activityID = NEW.activityID
    AND isDeleted = FALSE
    AND availableCapacity > 0;
  IF ROW_COUNT() <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Activity unavailable or fully booked.';
  END IF;
END$$

CREATE TRIGGER trg_booking_create_ticket
AFTER INSERT ON Booking
FOR EACH ROW
BEGIN
  INSERT INTO DigitalTicket (bookingID, ticketCode)
  VALUES (NEW.bookingID, CONCAT('ERA-', HEX(RANDOM_BYTES(12))));
END$$

CREATE TRIGGER trg_stamp_validate_owner
BEFORE INSERT ON DigitalStamp
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM Booking b
    JOIN DigitalActivityPassport p ON p.customerID = b.customerID
    WHERE b.bookingID = NEW.bookingID
      AND b.status = 'Completed'
      AND p.passportID = NEW.passportID
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stamp requires a completed booking and its customer passport.';
  END IF;
END$$

CREATE TRIGGER trg_booking_award_stamp
AFTER UPDATE ON Booking
FOR EACH ROW
BEGIN
  IF OLD.status = 'Confirmed' AND NEW.status = 'Completed' THEN
    INSERT INTO DigitalStamp (passportID, bookingID)
    SELECT p.passportID, NEW.bookingID
    FROM DigitalActivityPassport p
    WHERE p.customerID = NEW.customerID;
  END IF;
END$$

DELIMITER ;

-- Example of the API's ONE-STEP booking operation:
-- INSERT INTO Booking (customerID, activityID) VALUES (1, 1);
-- Triggers reserve exactly one seat and generate the corresponding ticket.
-- Example of the provider's completion operation (after ownership validation):
-- UPDATE Booking SET status = 'Completed' WHERE bookingID = 1 AND status = 'Confirmed';
-- Example of soft deletion (after ownership validation):
-- UPDATE Activity SET isDeleted = TRUE WHERE activityID = 1 AND isDeleted = FALSE;
-- An active booking makes the deletion fail with a descriptive MySQL error.

-- WARNING: Because Customer and ServiceProvider are separate physical tables,
-- their per-table UNIQUE constraints alone cannot ensure a username/email is
-- globally unique across BOTH roles. Registration in the backend MUST coordinate
-- cross-role identity uniqueness transactionally (or add a shared identity index).
-- Their AUTO_INCREMENT userIDs may also overlap across the two tables; the API
-- must always include the role when identifying an account.
-- This schema follows the instructor's instruction not to create a User table.
