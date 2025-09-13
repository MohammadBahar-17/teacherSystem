"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Calendar, User, BookOpen, Printer, FileSpreadsheet } from "lucide-react"

interface ScheduleSlot {
  day: string
  timeSlot: string
  classId: string
  className: string
  subject: string
  teacherId: string
  teacherName: string
}

interface ScheduleDisplayProps {
  schedule: ScheduleSlot[] | null
}

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
const TIME_SLOTS = ["الحصة الأولى", "الحصة الثانية", "الحصة الثالثة", "الحصة الرابعة", "الحصة الخامسة", "الحصة السادسة"]

export function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  const [viewMode, setViewMode] = useState<"grid" | "teacher" | "class">("grid")
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  if (!schedule || schedule.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا يوجد جدول</h3>
          <p className="text-muted-foreground text-center">قم بتوليد الجدول أولاً من تبويب "مولد الجدول"</p>
        </CardContent>
      </Card>
    )
  }

  // تنظيم البيانات للعرض
  const scheduleGrid = new Map<string, Map<string, ScheduleSlot>>()
  DAYS.forEach((day) => {
    const dayMap = new Map<string, ScheduleSlot>()
    TIME_SLOTS.forEach((timeSlot) => {
      const slot = schedule.find((s) => s.day === day && s.timeSlot === timeSlot)
      if (slot) {
        dayMap.set(timeSlot, slot)
      }
    })
    scheduleGrid.set(day, dayMap)
  })

  // تجميع البيانات حسب المعلم
  const teacherSchedules = new Map<string, ScheduleSlot[]>()
  schedule.forEach((slot) => {
    const key = `${slot.teacherId}-${slot.teacherName}`
    if (!teacherSchedules.has(key)) {
      teacherSchedules.set(key, [])
    }
    teacherSchedules.get(key)!.push(slot)
  })

  // تجميع البيانات حسب الصف
  const classSchedules = new Map<string, ScheduleSlot[]>()
  schedule.forEach((slot) => {
    const key = `${slot.classId}-${slot.className}`
    if (!classSchedules.has(key)) {
      classSchedules.set(key, [])
    }
    classSchedules.get(key)!.push(slot)
  })

  // دالة التصدير إلى CSV
  const exportToCSV = () => {
    const headers = ["اليوم", "الوقت", "الصف", "المادة", "المعلم"]
    const rows = schedule.map((slot) => [slot.day, slot.timeSlot, slot.className, slot.subject, slot.teacherName])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `جدول_الحصص_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  // دالة التصدير إلى Excel
  const exportToExcel = () => {
    // إنشاء HTML table للجدول الشامل
    const createTableHTML = () => {
      let html = `
        <table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial;">
          <tr style="background-color: #f0f0f0; font-weight: bold;">
            <th style="padding: 8px; text-align: center;">الوقت</th>
            ${DAYS.map((day) => `<th style="padding: 8px; text-align: center;">${day}</th>`).join("")}
          </tr>
      `

      TIME_SLOTS.forEach((timeSlot) => {
        html += `<tr>`
        html += `<td style="padding: 8px; text-align: center; background-color: #f9f9f9; font-weight: bold;">${timeSlot}</td>`

        DAYS.forEach((day) => {
          const slot = scheduleGrid.get(day)?.get(timeSlot)
          if (slot) {
            html += `<td style="padding: 8px; text-align: center;">
              <div style="font-weight: bold; color: #0066cc;">${slot.className}</div>
              <div style="margin: 2px 0;">${slot.subject}</div>
              <div style="font-size: 12px; color: #666;">${slot.teacherName}</div>
            </td>`
          } else {
            html += `<td style="padding: 8px; text-align: center; color: #999;">فارغ</td>`
          }
        })

        html += `</tr>`
      })

      html += `</table>`
      return html
    }

    // إنشاء ملف Excel
    const tableHTML = createTableHTML()
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>جدول الحصص</x:Name>
                  <x:WorksheetSource HRef="sheet1.htm"/>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <h2 style="text-align: center; font-family: Arial;">جدول الحصص الأسبوعي</h2>
          <p style="text-align: center; color: #666; font-family: Arial;">تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}</p>
          ${tableHTML}
        </body>
      </html>
    `

    // تحميل الملف
    const blob = new Blob(["\ufeff" + excelContent], {
      type: "application/vnd.ms-excel;charset=utf-8",
    })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `جدول_الحصص_${new Date().toISOString().split("T")[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // دالة الطباعة
  const handlePrint = () => {
    window.print()
  }

  // إحصائيات الجدول
  const stats = {
    totalSlots: schedule.length,
    uniqueTeachers: new Set(schedule.map((s) => s.teacherId)).size,
    uniqueClasses: new Set(schedule.map((s) => s.classId)).size,
    uniqueSubjects: new Set(schedule.map((s) => s.subject)).size,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">عرض الجدول المُولد</h2>
          <p className="text-muted-foreground">جدول الحصص النهائي مع إمكانيات العرض والتصدير</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            طباعة
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            تصدير CSV
          </Button>
          <Button onClick={exportToExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* إحصائيات الجدول */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalSlots}</div>
            <div className="text-sm text-muted-foreground">إجمالي الحصص</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{stats.uniqueTeachers}</div>
            <div className="text-sm text-muted-foreground">المعلمون</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{stats.uniqueClasses}</div>
            <div className="text-sm text-muted-foreground">الصفوف</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-chart-1">{stats.uniqueSubjects}</div>
            <div className="text-sm text-muted-foreground">المواد</div>
          </CardContent>
        </Card>
      </div>

      {/* أوضاع العرض */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grid">الجدول الشامل</TabsTrigger>
          <TabsTrigger value="teacher">حسب المعلم</TabsTrigger>
          <TabsTrigger value="class">حسب الصف</TabsTrigger>
        </TabsList>

        {/* الجدول الشامل */}
        <TabsContent value="grid" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                الجدول الأسبوعي الشامل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center font-bold">الوقت</TableHead>
                      {DAYS.map((day) => (
                        <TableHead key={day} className="text-center font-bold min-w-[200px]">
                          {day}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TIME_SLOTS.map((timeSlot) => (
                      <TableRow key={timeSlot}>
                        <TableCell className="font-medium text-center bg-muted">{timeSlot}</TableCell>
                        {DAYS.map((day) => {
                          const slot = scheduleGrid.get(day)?.get(timeSlot)
                          return (
                            <TableCell key={`${day}-${timeSlot}`} className="p-2">
                              {slot ? (
                                <div className="space-y-1">
                                  <Badge variant="secondary" className="w-full justify-center">
                                    {slot.className}
                                  </Badge>
                                  <div className="text-sm font-medium">{slot.subject}</div>
                                  <div className="text-xs text-muted-foreground">{slot.teacherName}</div>
                                </div>
                              ) : (
                                <div className="text-center text-muted-foreground text-sm">فارغ</div>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* عرض حسب المعلم */}
        <TabsContent value="teacher" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="اختر معلماً" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعلمين</SelectItem>
                  {Array.from(teacherSchedules.keys()).map((teacherKey) => {
                    const [, teacherName] = teacherKey.split("-")
                    return (
                      <SelectItem key={teacherKey} value={teacherKey}>
                        {teacherName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {Array.from(teacherSchedules.entries())
                .filter(([teacherKey]) => selectedFilter === "all" || selectedFilter === teacherKey)
                .map(([teacherKey, slots]) => {
                  const [, teacherName] = teacherKey.split("-")
                  return (
                    <Card key={teacherKey}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {teacherName}
                        </CardTitle>
                        <CardDescription>
                          {slots.length} حصة أسبوعياً - {new Set(slots.map((s) => s.subject)).size} مادة
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {slots
                            .sort((a, b) => {
                              const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
                              if (dayOrder !== 0) return dayOrder
                              return TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot)
                            })
                            .map((slot, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{slot.day}</Badge>
                                  <Badge variant="secondary">{slot.timeSlot}</Badge>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{slot.subject}</div>
                                  <div className="text-sm text-muted-foreground">{slot.className}</div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        </TabsContent>

        {/* عرض حسب الصف */}
        <TabsContent value="class" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="اختر صفاً" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  {Array.from(classSchedules.keys()).map((classKey) => {
                    const [, className] = classKey.split("-")
                    return (
                      <SelectItem key={classKey} value={classKey}>
                        {className}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {Array.from(classSchedules.entries())
                .filter(([classKey]) => selectedFilter === "all" || selectedFilter === classKey)
                .map(([classKey, slots]) => {
                  const [, className] = classKey.split("-")
                  return (
                    <Card key={classKey}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          {className}
                        </CardTitle>
                        <CardDescription>
                          {slots.length} حصة أسبوعياً - {new Set(slots.map((s) => s.subject)).size} مادة
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>الوقت</TableHead>
                                {DAYS.map((day) => (
                                  <TableHead key={day} className="text-center">
                                    {day}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {TIME_SLOTS.map((timeSlot) => (
                                <TableRow key={timeSlot}>
                                  <TableCell className="font-medium">{timeSlot}</TableCell>
                                  {DAYS.map((day) => {
                                    const slot = slots.find((s) => s.day === day && s.timeSlot === timeSlot)
                                    return (
                                      <TableCell key={`${day}-${timeSlot}`} className="text-center">
                                        {slot ? (
                                          <div className="space-y-1">
                                            <Badge variant="default">{slot.subject}</Badge>
                                            <div className="text-xs text-muted-foreground">{slot.teacherName}</div>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                    )
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
