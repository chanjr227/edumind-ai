-- CreateTable
CREATE TABLE `course_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `course_sections_courseId_idx`(`courseId`),
    UNIQUE INDEX `course_sections_courseId_order_key`(`courseId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_lessons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NULL,
    `videoUrl` VARCHAR(500) NULL,
    `durationMinutes` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isPreview` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `course_lessons_sectionId_idx`(`sectionId`),
    UNIQUE INDEX `course_lessons_sectionId_order_key`(`sectionId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_sections` ADD CONSTRAINT `course_sections_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_lessons` ADD CONSTRAINT `course_lessons_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `course_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
