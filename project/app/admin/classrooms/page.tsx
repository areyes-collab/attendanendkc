'use client';

import { useEffect, useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClassroomForm } from '@/components/admin/classroom-form';
import { PageHeader } from '@/components/layout/page-header';
import { SidebarContext } from '../layout';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { subscribeToCollection, deleteDocument } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Classroom {
  id: string;
  name: string;
  location: string;
  created_at: string;
  updated_at?: string;
}

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection('classrooms', (data) => {
      const sortedClassrooms = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setClassrooms(sortedClassrooms);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom?')) return;

    try {
      await deleteDocument('classrooms', id);
    } catch (error) {
      console.error('Error deleting classroom:', error);
    }
  };

  const handleEdit = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedClassroom(null);
  };

  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);

  if (isLoading) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading classrooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <PageHeader 
          title="Classrooms"
          subtitle="Manage classroom locations and details"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Classroom
              </Button>
            </div>

            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <ClassroomForm
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setSelectedClassroom(null);
                  }}
                  classroom={selectedClassroom ?? undefined}
                  mode={selectedClassroom ? 'edit' : 'create'}
                />
              </div>
            )}

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Classroom Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classrooms.map((classroom) => (
                      <TableRow key={classroom.id}>
                        <TableCell>{classroom.name}</TableCell>
                        <TableCell>{classroom.location}</TableCell>
                        <TableCell>{new Date(classroom.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(classroom)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(classroom.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {classrooms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No classrooms found</h3>
                            <p className="text-gray-600 mb-4">Get started by adding your first classroom.</p>
                            <Button onClick={() => setShowForm(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Classroom
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}