interface Teacher {
  id: string
  name: string
  subject: string
  maxHoursPerDay: number
  availableDays: string[]
  preferredTimes: string[]
  allowedGrades?: string[] // Added allowedGrades field
}

interface ClassSubject {
  subject: string
  hoursPerWeek: number
  preferredDays: string[]
}

interface SchoolClass {
  id: string
  name: string
  grade: string
  studentCount: number
  subjects: ClassSubject[]
  constraints: {
    maxHoursPerDay: number
    preferredStartTime: string
    preferredEndTime: string
  }
}

interface ScheduleSlot {
  day: string
  timeSlot: string
  classId: string
  className: string
  subject: string
  teacherId: string
  teacherName: string
}

interface GenerationResult {
  success: boolean
  schedule?: ScheduleSlot[]
  message?: string
  conflicts?: string[]
  stats?: {
    totalSlots: number
    filledSlots: number
    iterations: number
    duration: number
  }
}

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
const TIME_SLOTS = ["الحصة الأولى", "الحصة الثانية", "الحصة الثالثة", "الحصة الرابعة", "الحصة الخامسة", "الحصة السادسة"]

export async function generateScheduleWithBacktracking(
  teachers: Teacher[],
  classes: SchoolClass[],
  onLog: (message: string) => void,
  onProgress: (progress: number) => void,
): Promise<GenerationResult> {
  const startTime = Date.now()
  let iterations = 0

  onLog("بدء عملية توليد الجدول...")
  onLog(`عدد المعلمين: ${teachers.length}`)
  onLog(`عدد الصفوف: ${classes.length}`)

  // إنشاء قائمة بجميع الحصص المطلوبة
  const requiredLessons: Array<{
    classId: string
    className: string
    subject: string
    hoursNeeded: number
    preferredDays: string[]
    constraints: SchoolClass["constraints"]
  }> = []

  classes.forEach((schoolClass) => {
    schoolClass.subjects.forEach((subject) => {
      requiredLessons.push({
        classId: schoolClass.id,
        className: schoolClass.name,
        subject: subject.subject,
        hoursNeeded: subject.hoursPerWeek,
        preferredDays: subject.preferredDays,
        constraints: schoolClass.constraints,
      })
    })
  })

  onLog(`إجمالي الحصص المطلوبة: ${requiredLessons.reduce((sum, lesson) => sum + lesson.hoursNeeded, 0)}`)

  // إنشاء خريطة المعلمين حسب المادة
  const teachersBySubject = new Map<string, Teacher[]>()
  teachers.forEach((teacher) => {
    if (!teachersBySubject.has(teacher.subject)) {
      teachersBySubject.set(teacher.subject, [])
    }
    teachersBySubject.get(teacher.subject)!.push(teacher)
  })

  // التحقق من وجود معلمين لجميع المواد والصفوف
  const missingTeachers: string[] = []
  const gradeTeacherConflicts: string[] = [] // Added grade-teacher conflict tracking

  requiredLessons.forEach((lesson) => {
    if (!teachersBySubject.has(lesson.subject)) {
      missingTeachers.push(lesson.subject)
    } else {
      const availableTeachers = teachersBySubject.get(lesson.subject)!
      const classGrade = classes.find((c) => c.id === lesson.classId)?.grade

      if (classGrade) {
        const canTeachGrade = availableTeachers.some(
          (teacher) =>
            !teacher.allowedGrades || teacher.allowedGrades.length === 0 || teacher.allowedGrades.includes(classGrade),
        )

        if (!canTeachGrade) {
          gradeTeacherConflicts.push(`لا يوجد معلم يمكنه تدريس ${lesson.subject} للصف ${classGrade}`)
        }
      }
    }
  })

  if (missingTeachers.length > 0 || gradeTeacherConflicts.length > 0) {
    const allConflicts = [
      ...missingTeachers.map((subject) => `لا يوجد معلم للمادة: ${subject}`),
      ...gradeTeacherConflicts,
    ]

    return {
      success: false,
      message: "لا يوجد معلمون مناسبون لبعض المواد أو الصفوف",
      conflicts: allConflicts,
    }
  }

  // إنشاء الجدول الفارغ
  const schedule: ScheduleSlot[] = []
  const teacherSchedule = new Map<string, Map<string, Map<string, boolean>>>() // teacherId -> day -> timeSlot -> occupied
  const classSchedule = new Map<string, Map<string, Map<string, boolean>>>() // classId -> day -> timeSlot -> occupied

  // تهيئة جداول المعلمين والصفوف
  teachers.forEach((teacher) => {
    const teacherMap = new Map<string, Map<string, boolean>>()
    DAYS.forEach((day) => {
      const dayMap = new Map<string, boolean>()
      TIME_SLOTS.forEach((timeSlot) => {
        dayMap.set(timeSlot, false)
      })
      teacherMap.set(day, dayMap)
    })
    teacherSchedule.set(teacher.id, teacherMap)
  })

  classes.forEach((schoolClass) => {
    const classMap = new Map<string, Map<string, boolean>>()
    DAYS.forEach((day) => {
      const dayMap = new Map<string, boolean>()
      TIME_SLOTS.forEach((timeSlot) => {
        dayMap.set(timeSlot, false)
      })
      classMap.set(day, dayMap)
    })
    classSchedule.set(schoolClass.id, classMap)
  })

  // دالة للتحقق من صحة الجدولة
  function isValidAssignment(
    lesson: (typeof requiredLessons)[0],
    teacher: Teacher,
    day: string,
    timeSlot: string,
  ): boolean {
    // التحقق من توفر المعلم في هذا اليوم
    if (!teacher.availableDays.includes(day)) {
      return false
    }

    // التحقق من قيد الصفوف المسموح تدريسها
    if (teacher.allowedGrades && teacher.allowedGrades.length > 0) {
      const classGrade = classes.find((c) => c.id === lesson.classId)?.grade
      if (classGrade && !teacher.allowedGrades.includes(classGrade)) {
        return false
      }
    }

    // التحقق من عدم تعارض المعلم
    if (teacherSchedule.get(teacher.id)?.get(day)?.get(timeSlot)) {
      return false
    }

    // التحقق من عدم تعارض الصف
    if (classSchedule.get(lesson.classId)?.get(day)?.get(timeSlot)) {
      return false
    }

    // التحقق من قيود الوقت للصف
    const timeSlotIndex = TIME_SLOTS.indexOf(timeSlot)
    const startTimeIndex = TIME_SLOTS.indexOf(lesson.constraints.preferredStartTime)
    const endTimeIndex = TIME_SLOTS.indexOf(lesson.constraints.preferredEndTime)

    if (timeSlotIndex < startTimeIndex || timeSlotIndex > endTimeIndex) {
      return false
    }

    // التحقق من الحد الأقصى للحصص يومياً للمعلم
    const teacherDaySchedule = teacherSchedule.get(teacher.id)?.get(day)
    if (teacherDaySchedule) {
      const occupiedSlots = Array.from(teacherDaySchedule.values()).filter((occupied) => occupied).length
      if (occupiedSlots >= teacher.maxHoursPerDay) {
        return false
      }
    }

    // التحقق من الحد الأقصى للحصص يومياً للصف
    const classDaySchedule = classSchedule.get(lesson.classId)?.get(day)
    if (classDaySchedule) {
      const occupiedSlots = Array.from(classDaySchedule.values()).filter((occupied) => occupied).length
      if (occupiedSlots >= lesson.constraints.maxHoursPerDay) {
        return false
      }
    }

    return true
  }

  // دالة لتعيين حصة
  function assignLesson(lesson: (typeof requiredLessons)[0], teacher: Teacher, day: string, timeSlot: string): void {
    schedule.push({
      day,
      timeSlot,
      classId: lesson.classId,
      className: lesson.className,
      subject: lesson.subject,
      teacherId: teacher.id,
      teacherName: teacher.name,
    })

    teacherSchedule.get(teacher.id)?.get(day)?.set(timeSlot, true)
    classSchedule.get(lesson.classId)?.get(day)?.set(timeSlot, true)
  }

  // دالة لإلغاء تعيين حصة
  function unassignLesson(lesson: (typeof requiredLessons)[0], teacher: Teacher, day: string, timeSlot: string): void {
    const index = schedule.findIndex(
      (slot) =>
        slot.day === day &&
        slot.timeSlot === timeSlot &&
        slot.classId === lesson.classId &&
        slot.teacherId === teacher.id,
    )
    if (index !== -1) {
      schedule.splice(index, 1)
    }

    teacherSchedule.get(teacher.id)?.get(day)?.set(timeSlot, false)
    classSchedule.get(lesson.classId)?.get(day)?.set(timeSlot, false)
  }

  // خوارزمية Backtracking الرئيسية
  async function backtrack(lessonIndex: number, currentHours: Map<string, number>): Promise<boolean> {
    iterations++

    // تحديث التقدم
    if (iterations % 100 === 0) {
      const progress = (lessonIndex / requiredLessons.length) * 100
      onProgress(Math.min(progress, 95))
      onLog(`معالجة الحصة ${lessonIndex + 1} من ${requiredLessons.length}`)

      // إعطاء فرصة للواجهة للتحديث
      await new Promise((resolve) => setTimeout(resolve, 1))
    }

    if (lessonIndex >= requiredLessons.length) {
      return true // تم جدولة جميع الحصص بنجاح
    }

    const lesson = requiredLessons[lessonIndex]
    const hoursScheduled = currentHours.get(`${lesson.classId}-${lesson.subject}`) || 0

    if (hoursScheduled >= lesson.hoursNeeded) {
      return await backtrack(lessonIndex + 1, currentHours) // تم جدولة جميع حصص هذه المادة
    }

    const availableTeachers = teachersBySubject.get(lesson.subject) || []

    // ترتيب الأيام حسب الأفضلية
    const daysToTry = [...DAYS]
    if (lesson.preferredDays.length > 0) {
      daysToTry.sort((a, b) => {
        const aPreferred = lesson.preferredDays.includes(a) ? 0 : 1
        const bPreferred = lesson.preferredDays.includes(b) ? 0 : 1
        return aPreferred - bPreferred
      })
    }

    // تجربة جميع الاحتمالات
    for (const teacher of availableTeachers) {
      // التحقق من قيد الصفوف المسموح تدريسها قبل المحاولة
      if (teacher.allowedGrades && teacher.allowedGrades.length > 0) {
        const classGrade = classes.find((c) => c.id === lesson.classId)?.grade
        if (classGrade && !teacher.allowedGrades.includes(classGrade)) {
          continue // تخطي هذا المعلم لأنه لا يستطيع تدريس هذا الصف
        }
      }

      // ترتيب الأوقات حسب تفضيلات المعلم
      const timeSlotsToTry = [...TIME_SLOTS]
      if (teacher.preferredTimes.length > 0) {
        timeSlotsToTry.sort((a, b) => {
          const aPreferred = teacher.preferredTimes.includes(a) ? 0 : 1
          const bPreferred = teacher.preferredTimes.includes(b) ? 0 : 1
          return aPreferred - bPreferred
        })
      }

      for (const day of daysToTry) {
        for (const timeSlot of timeSlotsToTry) {
          if (isValidAssignment(lesson, teacher, day, timeSlot)) {
            // تعيين الحصة
            assignLesson(lesson, teacher, day, timeSlot)

            const newHours = new Map(currentHours)
            const key = `${lesson.classId}-${lesson.subject}`
            newHours.set(key, (newHours.get(key) || 0) + 1)

            // المتابعة مع الحصة التالية
            if (await backtrack(lessonIndex + 1, newHours)) {
              return true
            }

            // إلغاء التعيين والمحاولة مرة أخرى
            unassignLesson(lesson, teacher, day, timeSlot)
          }
        }
      }
    }

    return false // لم يتم العثور على حل صالح
  }

  onLog("بدء خوارزمية Backtracking...")

  const success = await backtrack(0, new Map())
  const duration = Date.now() - startTime

  onLog(`انتهت الخوارزمية في ${duration}ms بعد ${iterations} تكرار`)

  if (success) {
    onLog(`تم توليد الجدول بنجاح! تم جدولة ${schedule.length} حصة`)
    return {
      success: true,
      schedule,
      stats: {
        totalSlots: DAYS.length * TIME_SLOTS.length * classes.length,
        filledSlots: schedule.length,
        iterations,
        duration,
      },
    }
  } else {
    onLog("فشل في إيجاد حل صالح للجدول")
    return {
      success: false,
      message: "لم يتم العثور على حل صالح. قد تحتاج إلى تعديل القيود أو إضافة معلمين",
      conflicts: ["تعارض في القيود", "عدم كفاية المعلمين", "قيود زمنية صارمة جداً"],
    }
  }
}
