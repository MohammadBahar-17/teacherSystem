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
import { Trash2, Edit, Plus, BookOpen, Users } from "lucide-react"

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

interface ClassManagementProps {
  classes: SchoolClass[]
  setClasses: (classes: SchoolClass[]) => void
}

const GRADES = [
  "الصف الأول",
  "الصف الثاني",
  "الصف الثالث",
  "الصف الرابع",
  "الصف الخامس",
  "الصف السادس",
  "الصف السابع",
  "الصف الثامن",
  "الصف التاسع",
  "الصف العاشر",
  "الصف الحادي عشر",
  "الصف الثاني عشر",
]
const SUBJECTS = [
  "الرياضيات",
  "العلوم",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "التاريخ",
  "الجغرافيا",
  "التربية الإسلامية",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
]
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
const TIME_SLOTS = ["الحصة الأولى", "الحصة الثانية", "الحصة الثالثة", "الحصة الرابعة", "الحصة الخامسة", "الحصة السادسة"]

export function ClassManagement({ classes, setClasses }: ClassManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    studentCount: 25,
    subjects: [] as ClassSubject[],
    constraints: {
      maxHoursPerDay: 6,
      preferredStartTime: "الحصة الأولى",
      preferredEndTime: "الحصة السادسة",
    },
  })

  // Subject form state
  const [subjectForm, setSubjectForm] = useState({
    subject: "",
    hoursPerWeek: 2,
    preferredDays: [] as string[],
  })

  const resetForm = () => {
    setFormData({
      name: "",
      grade: "",
      studentCount: 25,
      subjects: [],
      constraints: {
        maxHoursPerDay: 6,
        preferredStartTime: "الحصة الأولى",
        preferredEndTime: "الحصة السادسة",
      },
    })
    setSubjectForm({
      subject: "",
      hoursPerWeek: 2,
      preferredDays: [],
    })
    setEditingClass(null)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.grade || formData.subjects.length === 0) return

    const schoolClass: SchoolClass = {
      id: editingClass?.id || Date.now().toString(),
      ...formData,
    }

    if (editingClass) {
      setClasses(classes.map((c) => (c.id === editingClass.id ? schoolClass : c)))
    } else {
      setClasses([...classes, schoolClass])
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (schoolClass: SchoolClass) => {
    setEditingClass(schoolClass)
    setFormData({
      name: schoolClass.name,
      grade: schoolClass.grade,
      studentCount: schoolClass.studentCount,
      subjects: schoolClass.subjects,
      constraints: schoolClass.constraints,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setClasses(classes.filter((c) => c.id !== id))
  }

  const addSubject = () => {
    if (!subjectForm.subject) return

    const newSubject: ClassSubject = {
      subject: subjectForm.subject,
      hoursPerWeek: subjectForm.hoursPerWeek,
      preferredDays: subjectForm.preferredDays,
    }

    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSubject],
    }))

    setSubjectForm({
      subject: "",
      hoursPerWeek: 2,
      preferredDays: [],
    })
  }

  const removeSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }))
  }

  const toggleDay = (day: string) => {
    setSubjectForm((prev) => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter((d) => d !== day)
        : [...prev.preferredDays, day],
    }))
  }

  const selectAllDays = () => {
    setSubjectForm((prev) => ({
      ...prev,
      preferredDays: prev.preferredDays.length === DAYS.length ? [] : [...DAYS],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">إدارة الصفوف والمواد</h2>
          <p className="text-muted-foreground">إضافة وتعديل الصفوف ومتطلبات المواد الدراسية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              إضافة صف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClass ? "تعديل بيانات الصف" : "إضافة صف جديد"}</DialogTitle>
              <DialogDescription>أدخل بيانات الصف والمواد الدراسية المطلوبة</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Basic Class Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="className">اسم الصف</Label>
                  <Input
                    id="className"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: 1أ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">المرحلة الدراسية</Label>
                  <Select
                    value={formData.grade}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, grade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentCount">عدد الطلاب</Label>
                  <Input
                    id="studentCount"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.studentCount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, studentCount: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>
              </div>

              {/* Class Constraints */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">قيود الجدولة</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>الحد الأقصى للحصص يومياً</Label>
                    <Input
                      type="number"
                      min="1"
                      max="8"
                      value={formData.constraints.maxHoursPerDay}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          constraints: {
                            ...prev.constraints,
                            maxHoursPerDay: Number.parseInt(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت البداية المفضل</Label>
                    <Select
                      value={formData.constraints.preferredStartTime}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          constraints: { ...prev.constraints, preferredStartTime: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>وقت النهاية المفضل</Label>
                    <Select
                      value={formData.constraints.preferredEndTime}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          constraints: { ...prev.constraints, preferredEndTime: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Add Subject Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إضافة مادة دراسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المادة</Label>
                      <Select
                        value={subjectForm.subject}
                        onValueChange={(value) => setSubjectForm((prev) => ({ ...prev, subject: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.filter((subject) => !formData.subjects.some((s) => s.subject === subject)).map(
                            (subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>عدد الحصص أسبوعياً</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={subjectForm.hoursPerWeek}
                        onChange={(e) =>
                          setSubjectForm((prev) => ({ ...prev, hoursPerWeek: Number.parseInt(e.target.value) }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>الأيام المفضلة (اختياري)</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={selectAllDays} className="text-xs">
                        {subjectForm.preferredDays.length === DAYS.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={subjectForm.preferredDays.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleDay(day)}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={addSubject} disabled={!subjectForm.subject} className="w-full">
                    إضافة المادة
                  </Button>
                </CardContent>
              </Card>

              {/* Added Subjects List */}
              {formData.subjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المواد المضافة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {formData.subjects.map((subject, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{subject.subject}</Badge>
                              <span className="text-sm text-muted-foreground">{subject.hoursPerWeek} حصص أسبوعياً</span>
                            </div>
                            {subject.preferredDays.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {subject.preferredDays.map((day) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {day}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSubject(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.grade || formData.subjects.length === 0}
              >
                {editingClass ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا يوجد صفوف</h3>
              <p className="text-muted-foreground text-center mb-4">ابدأ بإضافة الصفوف والمواد الدراسية</p>
              <Button onClick={() => setIsDialogOpen(true)}>إضافة أول صف</Button>
            </CardContent>
          </Card>
        ) : (
          classes.map((schoolClass) => (
            <Card key={schoolClass.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{schoolClass.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="mr-2">
                        {schoolClass.grade}
                      </Badge>
                      <Users className="w-4 h-4 inline mr-1" />
                      {schoolClass.studentCount} طالب
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(schoolClass)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schoolClass.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">قيود الجدولة:</Label>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>الحد الأقصى: {schoolClass.constraints.maxHoursPerDay} حصص يومياً</span>
                      <span>
                        من {schoolClass.constraints.preferredStartTime} إلى {schoolClass.constraints.preferredEndTime}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">المواد الدراسية ({schoolClass.subjects.length}):</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                      {schoolClass.subjects.map((subject, index) => (
                        <div key={index} className="p-2 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{subject.subject}</Badge>
                            <span className="text-xs text-muted-foreground">{subject.hoursPerWeek}ح</span>
                          </div>
                          {subject.preferredDays.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {subject.preferredDays.map((day) => (
                                <Badge key={day} variant="secondary" className="text-xs">
                                  {day.slice(0, 3)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
