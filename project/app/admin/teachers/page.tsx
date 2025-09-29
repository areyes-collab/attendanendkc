'use client';

import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TeacherForm } from '@/components/admin/teacher-form';
import { PageHeader } from '@/components/layout/page-header';
import { SidebarContext } from '../layout';
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import { subscribeToCollection, deleteDocument } from '@/lib/firebase';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const contentVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

interface Teacher {
  id: string;
  name: string;
  email: string;
  rfid_id: string;
  created_at: string;
}

export default function TeachersPage() {
  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to teachers collection for real-time updates
    const unsubscribe = subscribeToCollection('teachers', (data) => {
      // Sort by created_at descending
      const sortedTeachers = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTeachers(sortedTeachers);
      setFilteredTeachers(sortedTeachers);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = teachers.filter((teacher) =>
        teacher.name.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query) ||
        teacher.rfid_id.toLowerCase().includes(query)
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teachers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      await deleteDocument('teachers', id);
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gray-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading teachers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="h-full bg-gray-100"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="Teachers" 
          subtitle="Manage teacher accounts and RFID assignments"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div 
            className="space-y-6"
            variants={contentVariants}
            initial="initial"
            animate="animate"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 min-w-[240px]">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
              </Button>
            </div>

            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <TeacherForm
                  mode={selectedTeacher ? 'edit' : 'create'}
                  teacher={selectedTeacher ? {
                    id: selectedTeacher.id,
                    name: selectedTeacher.name,
                    email: selectedTeacher.email,
                    rfid_id: selectedTeacher.rfid_id
                  } : undefined}
                  onSuccess={() => {
                    setShowForm(false);
                    setSelectedTeacher(null);
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setSelectedTeacher(null);
                  }}
                />
              </div>
            )}

            <div className="rounded-md border bg-white shadow-sm">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-gray-50">
                    <tr className="border-b transition-colors">
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Email</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">RFID ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Created</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredTeachers.map((teacher) => (
                      <motion.tr 
                        key={teacher.id}
                        className="border-b transition-colors hover:bg-gray-50"
                        variants={itemVariants}
                      >
                        <td className="p-4 align-middle font-medium">{teacher.name}</td>
                        <td className="p-4 align-middle text-gray-600">{teacher.email}</td>
                        <td className="p-4 align-middle">
                          <code className="relative rounded bg-gray-100 px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {teacher.rfid_id}
                          </code>
                        </td>
                        <td className="p-4 align-middle text-gray-500 text-sm">
                          {new Date(teacher.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(teacher.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredTeachers.length === 0 && (
              <motion.div variants={itemVariants}>
                <Card>
                <CardContent className="text-center py-12">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No matching teachers</h3>
                      <p className="text-gray-600">Try adjusting your search terms</p>
                    </>
                  ) : (
                    <>
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                      <p className="text-gray-600 mb-4">Get started by adding your first teacher.</p>
                      <Button onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Teacher
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}