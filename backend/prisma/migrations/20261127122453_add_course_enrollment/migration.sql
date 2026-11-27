-- CreateTable
CREATE TABLE `course_enrollments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_enrollments_studentId_idx`(`studentId`),
    INDEX `course_enrollments_courseId_idx`(`courseId`),
    UNIQUE INDEX `course_enrollments_studentId_courseId_key`(`studentId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
