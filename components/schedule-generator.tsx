"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Play, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react"
import { generateScheduleWithBacktracking } from "@/lib/schedule-algorithm"

interface Teacher {
  id: string
  name: string
  subject: string
  maxHoursPerDay: number
  availableDays: string[]
  preferredTimes: string[]
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

interface ScheduleGeneratorProps {
  teachers: Teacher[]
  classes: SchoolClass[]
  onScheduleGenerated: (schedule: any) => void
}

export function ScheduleGenerator({ teachers, classes, onScheduleGenerated }: ScheduleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generationLog, setGenerationLog] = useState<string[]>([])
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    conflicts?: string[]
    stats?: {
      totalSlots: number
      filledSlots: number
      iterations: number
      duration: number
    }
  } | null>(null)

  const canGenerate = teachers.length > 0 && classes.length > 0

  const handleGenerate = async () => {
    if (!canGenerate) return

    setIsGenerating(true)
    setProgress(0)
    setGenerationLog([])
    setLastResult(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 15, 95))
      }, 200)

      const result = await generateScheduleWithBacktracking(
        teachers,
        classes,
        (log: string) => {
          setGenerationLog((prev) => [...prev, log])
        },
        (progress: number) => {
          setProgress(progress)
        },
      )

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setLastResult({
          success: true,
          message: "تم توليد الجدول بنجاح!",
          stats: result.stats,
        })
        onScheduleGenerated(result.schedule)
      } else {
        setLastResult({
          success: false,
          message: result.message || "فشل في توليد الجدول",
          conflicts: result.conflicts,
        })
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: "حدث خطأ أثناء توليد الجدول",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getValidationIssues = () => {
    const issues: string[] = []

    if (teachers.length === 0) {
      issues.push("لا يوجد معلمون مضافون")
    }

    if (classes.length === 0) {
      issues.push("لا يوجد صفوف مضافة")
    }

    // Check if all subjects have teachers
    const availableSubjects = new Set(teachers.map((t) => t.subject))
    const requiredSubjects = new Set()
    classes.forEach((cls) => {
      cls.subjects.forEach((subject) => {
        requiredSubjects.add(subject.subject)
      })
    })

    const missingTeachers = Array.from(requiredSubjects).filter((subject) => !availableSubjects.has(subject))
    if (missingTeachers.length > 0) {
      issues.push(`لا يوجد معلمون للمواد التالية: ${missingTeachers.join("، ")}`)
    }

    // Check for overloaded teachers
    const teacherWorkload = new Map<string, number>()
    teachers.forEach((teacher) => {
      let totalHours = 0
      classes.forEach((cls) => {
        const subjectHours = cls.subjects.find((s) => s.subject === teacher.subject)?.hoursPerWeek || 0
        totalHours += subjectHours
      })
      teacherWorkload.set(teacher.name, totalHours)
    })

    const overloadedTeachers = Array.from(teacherWorkload.entries()).filter(
      ([name, hours]) => hours > teachers.find((t) => t.name === name)!.maxHoursPerDay * 5,
    )

    if (overloadedTeachers.length > 0) {
      issues.push(
        `المعلمون التاليون محملون بحصص أكثر من طاقتهم: ${overloadedTeachers.map(([name]) => name).join("، ")}`,
      )
    }

    return issues
  }

  const validationIssues = getValidationIssues()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">مولد الجدول الذكي</h2>
        <p className="text-muted-foreground">استخدام خوارزمية Backtracking لتوليد جدول حصص خالي من التعارضات</p>
      </div>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationIssues.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            حالة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validationIssues.length === 0 ? (
            <div className="text-green-600">
              <p>جميع البيانات صحيحة ومكتملة. يمكن توليد الجدول الآن.</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span>المعلمون: {teachers.length}</span>
                <span>الصفوف: {classes.length}</span>
                <span>إجمالي المواد: {classes.reduce((total, cls) => total + cls.subjects.length, 0)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-yellow-600 font-medium">يجب حل المشاكل التالية قبل توليد الجدول:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationIssues.map((issue, index) => (
                  <li key={index} className="text-muted-foreground">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            توليد الجدول
          </CardTitle>
          <CardDescription>
            سيتم استخدام خوارزمية Backtracking لإيجاد أفضل توزيع للحصص مع تجنب التعارضات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating || validationIssues.length > 0}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                بدء توليد الجدول
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>التقدم</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Log */}
      {(isGenerating || generationLog.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجل التوليد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
              <div className="space-y-1 text-sm font-mono">
                {generationLog.map((log, index) => (
                  <div key={index} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
                {isGenerating && <div className="text-primary animate-pulse">جاري المعالجة...</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {lastResult && (
        <Alert className={lastResult.success ? "border-green-500" : "border-red-500"}>
          <div className="flex items-start gap-2">
            {lastResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertDescription className="font-medium">{lastResult.message}</AlertDescription>

              {lastResult.success && lastResult.stats && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{lastResult.stats.filledSlots}</div>
                    <div className="text-xs text-muted-foreground">حصص مجدولة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary">{lastResult.stats.totalSlots}</div>
                    <div className="text-xs text-muted-foreground">إجمالي الفترات</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent">{lastResult.stats.iterations}</div>
                    <div className="text-xs text-muted-foreground">تكرارات الخوارزمية</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-chart-1">{lastResult.stats.duration}ms</div>
                    <div className="text-xs text-muted-foreground">وقت التوليد</div>
                  </div>
                </div>
              )}

              {!lastResult.success && lastResult.conflicts && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">التعارضات المكتشفة:</p>
                  <div className="space-y-1">
                    {lastResult.conflicts.map((conflict, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {conflict}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}
    </div>
  )
}
