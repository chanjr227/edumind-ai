-- CreateTable
CREATE TABLE `course_certificates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `certificateNumber` VARCHAR(100) NOT NULL,
    `studentName` VARCHAR(150) NOT NULL,
    `courseTitle` VARCHAR(200) NOT NULL,
    `completedAt` DATETIME(3) NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `course_certificates_certificateNumber_key`(`certificateNumber`),
    INDEX `course_certificates_studentId_idx`(`studentId`),
    INDEX `course_certificates_courseId_idx`(`courseId`),
    UNIQUE INDEX `course_certificates_studentId_courseId_key`(`studentId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_certificates` ADD CONSTRAINT `course_certificates_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_certificates` ADD CONSTRAINT `course_certificates_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
