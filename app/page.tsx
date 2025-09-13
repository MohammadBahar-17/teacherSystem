"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeacherManagement } from "@/components/teacher-management"
import { ClassManagement } from "@/components/class-management"
import { ScheduleGenerator } from "@/components/schedule-generator"
import { ScheduleDisplay } from "@/components/schedule-display"
import { Users, BookOpen, Calendar, Settings } from "lucide-react"

const sampleTeachers = []
const sampleClasses = []

export default function HomePage() {
  const [teachers, setTeachers] = useState(sampleTeachers)
  const [classes, setClasses] = useState(sampleClasses)
  const [schedule, setSchedule] = useState(null)

  useEffect(() => {
    // Load data from localStorage if available
    const savedTeachers = localStorage.getItem("teachers")
    const savedClasses = localStorage.getItem("classes")

    if (savedTeachers) {
      setTeachers(JSON.parse(savedTeachers))
    }
    if (savedClasses) {
      setClasses(JSON.parse(savedClasses))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("teachers", JSON.stringify(teachers))
  }, [teachers])

  useEffect(() => {
    localStorage.setItem("classes", JSON.stringify(classes))
  }, [classes])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">نظام إدارة جدول الحصص</h1>
          <p className="text-muted-foreground text-lg">
            نظام ذكي لتوليد جداول الحصص وحل التعارضات باستخدام خوارزمية Backtracking
          </p>
          <div className="mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm inline-block">
            جاهز للاستخدام - ابدأ بإضافة المعلمين والصفوف
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المعلمون</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">إجمالي المعلمين</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الصفوف</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{classes.length}</div>
              <p className="text-xs text-muted-foreground">إجمالي الصفوف</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الجداول</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{schedule ? 1 : 0}</div>
              <p className="text-xs text-muted-foreground">الجداول المُولدة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحالة</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">جاهز</div>
              <p className="text-xs text-muted-foreground">حالة النظام</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="teachers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="teachers">إدارة المعلمين</TabsTrigger>
            <TabsTrigger value="classes">إدارة الصفوف</TabsTrigger>
            <TabsTrigger value="generator">مولد الجدول</TabsTrigger>
            <TabsTrigger value="schedule">عرض الجدول</TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="mt-6">
            <TeacherManagement teachers={teachers} setTeachers={setTeachers} />
          </TabsContent>

          <TabsContent value="classes" className="mt-6">
            <ClassManagement classes={classes} setClasses={setClasses} />
          </TabsContent>

          <TabsContent value="generator" className="mt-6">
            <ScheduleGenerator teachers={teachers} classes={classes} onScheduleGenerated={setSchedule} />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <ScheduleDisplay schedule={schedule} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
