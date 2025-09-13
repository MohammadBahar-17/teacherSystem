"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit, Plus, User } from "lucide-react"

interface Teacher {
  id: string
  name: string
  subject: string
  maxHoursPerDay: number
  availableDays: string[]
  preferredTimes: string[]
  allowedGrades: string[] // Added allowedGrades field
}

interface TeacherManagementProps {
  teachers: Teacher[]
  setTeachers: (teachers: Teacher[]) => void
}

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
const SUBJECTS = [
  "الرياضيات",
  "العلوم",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "التاريخ",
  "الجغرافيا",
  "التربية الإسلامية",
  "التربية الفنية", // Added more subjects
  "التربية البدنية",
  "الحاسوب",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
]
const TIME_SLOTS = ["الحصة الأولى", "الحصة الثانية", "الحصة الثالثة", "الحصة الرابعة", "الحصة الخامسة", "الحصة السادسة"]
const GRADES = ["الأول الابتدائي", "الثاني الابتدائي", "الثالث الابتدائي", "الرابع الابتدائي"] // Added grades list

export function TeacherManagement({ teachers, setTeachers }: TeacherManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    maxHoursPerDay: 4,
    availableDays: [] as string[],
    preferredTimes: [] as string[],
    allowedGrades: [] as string[], // Added allowedGrades to form data
  })

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      maxHoursPerDay: 4,
      availableDays: [],
      preferredTimes: [],
      allowedGrades: [], // Reset allowedGrades
    })
    setEditingTeacher(null)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.subject) return

    const teacher: Teacher = {
      id: editingTeacher?.id || Date.now().toString(),
      ...formData,
    }

    if (editingTeacher) {
      setTeachers(teachers.map((t) => (t.id === editingTeacher.id ? teacher : t)))
    } else {
      setTeachers([...teachers, teacher])
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      name: teacher.name,
      subject: teacher.subject,
      maxHoursPerDay: teacher.maxHoursPerDay,
      availableDays: teacher.availableDays,
      preferredTimes: teacher.preferredTimes,
      allowedGrades: teacher.allowedGrades || [], // Handle allowedGrades in edit
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setTeachers(teachers.filter((t) => t.id !== id))
  }

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  const toggleTime = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter((t) => t !== time)
        : [...prev.preferredTimes, time],
    }))
  }

  const toggleGrade = (grade: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedGrades: prev.allowedGrades.includes(grade)
        ? prev.allowedGrades.filter((g) => g !== grade)
        : [...prev.allowedGrades, grade],
    }))
  }

  const selectAllDays = () => {
    setFormData((prev) => ({
      ...prev,
      availableDays: formData.availableDays.length === DAYS.length ? [] : [...DAYS],
    }))
  }

  const selectAllTimes = () => {
    setFormData((prev) => ({
      ...prev,
      preferredTimes: formData.preferredTimes.length === TIME_SLOTS.length ? [] : [...TIME_SLOTS],
    }))
  }

  const selectAllGrades = () => {
    setFormData((prev) => ({
      ...prev,
      allowedGrades: formData.allowedGrades.length === GRADES.length ? [] : [...GRADES],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">إدارة المعلمين</h2>
          <p className="text-muted-foreground">إضافة وتعديل بيانات المعلمين ومتطلباتهم</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              إضافة معلم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}</DialogTitle>
              <DialogDescription>أدخل بيانات المعلم ومتطلباته للجدولة</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المعلم</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="أدخل اسم المعلم"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">المادة</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxHours">الحد الأقصى للحصص يومياً</Label>
                <Input
                  id="maxHours"
                  type="number"
                  min="1"
                  max="8"
                  value={formData.maxHoursPerDay}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, maxHoursPerDay: Number.parseInt(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>الأيام المتاحة</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={selectAllDays} className="text-xs">
                    {formData.availableDays.length === DAYS.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={formData.availableDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>الأوقات المفضلة</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={selectAllTimes} className="text-xs">
                    {formData.preferredTimes.length === TIME_SLOTS.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={formData.preferredTimes.includes(time) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => toggleTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>الصفوف المسموح تدريسها</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={selectAllGrades} className="text-xs">
                    {formData.allowedGrades.length === GRADES.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">اختر الصفوف التي يمكن للمعلم تدريسها</p>
                <div className="flex flex-wrap gap-2">
                  {GRADES.map((grade) => (
                    <Button
                      key={grade}
                      type="button"
                      variant={formData.allowedGrades.includes(grade) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleGrade(grade)}
                    >
                      {grade}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.subject}>
                {editingTeacher ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {teachers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا يوجد معلمون</h3>
              <p className="text-muted-foreground text-center mb-4">ابدأ بإضافة المعلمين لإنشاء جدول الحصص</p>
              <Button onClick={() => setIsDialogOpen(true)}>إضافة أول معلم</Button>
            </CardContent>
          </Card>
        ) : (
          teachers.map((teacher) => (
            <Card key={teacher.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{teacher.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="mr-2">
                        {teacher.subject}
                      </Badge>
                      الحد الأقصى: {teacher.maxHoursPerDay} حصص يومياً
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(teacher)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(teacher.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">الأيام المتاحة:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {teacher.availableDays.map((day) => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {teacher.preferredTimes.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">الأوقات المفضلة:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.preferredTimes.map((time) => (
                          <Badge key={time} variant="secondary" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {teacher.allowedGrades && teacher.allowedGrades.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">الصفوف المسموح تدريسها:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.allowedGrades.map((grade) => (
                          <Badge key={grade} variant="default" className="text-xs">
                            {grade}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
