 'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Search,
  Download,
  Upload,
  Key,
  Users,
  Clock
} from 'lucide-react';
import { getDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

interface RFIDCard {
  id: string;
  rfid_id: string;
  teacher_id?: string;
  status: 'active' | 'inactive' | 'lost' | 'damaged';
  assigned_date?: string;
  last_used?: string;
  created_at: string;
  updated_at?: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  rfid_id?: string;
}

export function CardManagement() {
  const { showToast } = useToast();
  const [cards, setCards] = useState<RFIDCard[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<RFIDCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    rfid_id: '',
    teacher_id: '',
    status: 'active' as 'active' | 'inactive' | 'lost' | 'damaged',
  });
  const [assignSelection, setAssignSelection] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cardsData, teachersData] = await Promise.all([
        getDocuments('rfid_cards'),
        getDocuments('teachers'),
      ]);

      setCards(cardsData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast("Failed to load card data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rfid_id.trim()) {
      showToast("Please enter a card ID", "error");
      return;
    }

    try {
      // Check if card already exists (for new cards)
      if (!editingCard) {
        const existingCards = await getDocuments('rfid_cards');
        const cardExists = existingCards.some(card => card.rfid_id === formData.rfid_id);

        if (cardExists) {
          showToast("This card ID is already registered", "error");
          return;
        }
      }

      showToast(editingCard ? "Updating card..." : "Registering card...", "info");

      if (editingCard) {
        // Update existing card
        await updateDocument('rfid_cards', editingCard.id, {
          status: formData.status,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new card
        const nowIso = new Date().toISOString();
        await createDocument('rfid_cards', {
          rfid_id: formData.rfid_id,
          status: formData.status,
          created_at: nowIso,
          updated_at: nowIso,
        });
      }

      showToast(
        editingCard ? "Card updated successfully" : "Card registered successfully",
        "success"
      );

      // Reset form and refresh data
      setFormData({ rfid_id: '', teacher_id: '', status: 'active' });
      setShowForm(false);
      setEditingCard(null);
      fetchData();

    } catch (error) {
      showToast(
        editingCard ? "Failed to update card" : "Failed to register card",
        "error"
      );
      console.error('Error saving card:', error);
    }
  };

  const handleEdit = (card: RFIDCard) => {
    setEditingCard(card);
    setFormData({
      rfid_id: card.rfid_id,
      teacher_id: card.teacher_id || '',
      status: card.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (card: RFIDCard) => {
    if (!confirm(`Are you sure you want to delete card ${card.rfid_id}?`)) return;

    showToast("Deleting card...", "info");

    try {
      await deleteDocument('rfid_cards', card.id);
      
      // Remove RFID ID from teacher if assigned
      if (card.teacher_id) {
        await updateDocument('teachers', card.teacher_id, {
          rfid_id: null
        });
      }

      showToast("Card deleted successfully", "success");
      fetchData();
    } catch (error) {
      showToast("Failed to delete card", "error");
      console.error('Error deleting card:', error);
    }
  };

  const handleStatusChange = async (card: RFIDCard, newStatus: string) => {
    showToast("Updating card status...", "info");

    try {
      await updateDocument('rfid_cards', card.id, {
        status: newStatus,
        updated_at: new Date().toISOString(),
      });

      showToast("Card status updated", "success");
      fetchData();
    } catch (error) {
      showToast("Failed to update status", "error");
      console.error('Error updating status:', error);
    }
  };

  const handleBulkImport = () => {
    // Placeholder for bulk import functionality
    showToast("Bulk import feature coming soon!", "info");
  };

  const handleExport = () => {
    // Create CSV export
    const csvData = cards.map(card => {
      const teacher = teachers.find(t => t.id === card.teacher_id);
      return {
        'RFID ID': card.rfid_id,
        'Teacher': teacher?.name || 'Unassigned',
        'Status': card.status,
        'Assigned Date': card.assigned_date ? new Date(card.assigned_date).toLocaleDateString() : 'N/A',
        'Last Used': card.last_used ? new Date(card.last_used).toLocaleDateString() : 'Never',
      };
    });

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfid-cards-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast("Card data exported successfully", "success");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'lost':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Lost
        </Badge>;
      case 'damaged':
        return <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Damaged
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredCards = cards.filter(card => {
    const teacher = teachers.find(t => t.id === card.teacher_id);
    const matchesSearch = 
      card.rfid_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: cards.length,
    active: cards.filter(c => c.status === 'active').length,
    assigned: cards.filter(c => c.teacher_id).length,
    unassigned: cards.filter(c => !c.teacher_id).length,
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading card management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Card Management</h1>
          <p className="text-gray-600">Manage RFID cards, assignments, and security</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
          <Button variant="outline" onClick={handleBulkImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Card Registration Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Register New Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rfid_id">Card ID</Label>
                  <Input
                    id="rfid_id"
                    value={formData.rfid_id}
                    onChange={(e) => setFormData({ ...formData, rfid_id: e.target.value })}
                    placeholder="Enter card ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lost">Lost</option>
                    <option value="damaged">Damaged</option>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Registering...' : 'Register Card'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">To teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <Key className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.unassigned}</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by RFID ID, teacher name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="lost">Lost</option>
                <option value="damaged">Damaged</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Table */}
      <div className="rounded-md border bg-white shadow-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-gray-50">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">RFID ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Teacher</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Assigned Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Last Used</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {filteredCards.map((card) => {
                const teacher = teachers.find(t => t.id === card.teacher_id);
                return (
                  <tr 
                    key={card.id}
                    className="border-b transition-colors hover:bg-gray-50"
                  >
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <code className="relative rounded bg-gray-100 px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {card.rfid_id}
                        </code>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {getStatusBadge(card.status)}
                    </td>
                    <td className="p-4 align-middle">
                      {teacher ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{teacher.name}</span>
                          <span className="text-sm text-gray-500">{teacher.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-gray-500 text-sm">
                      {card.assigned_date ? (
                        new Date(card.assigned_date).toLocaleDateString()
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4 align-middle text-gray-500 text-sm">
                      {card.last_used ? (
                        new Date(card.last_used).toLocaleDateString()
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        {!card.teacher_id ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={assignSelection[card.id] || ''}
                              onChange={(e) =>
                                setAssignSelection(prev => ({ ...prev, [card.id]: e.target.value }))
                              }
                              className="w-48"
                            >
                              <option value="">Assign to teacher...</option>
                              {teachers
                                .filter(t => !t.rfid_id)
                                .map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                            </Select>
                            <Button
                              size="sm"
                              onClick={async () => {
                                const selectedTeacherId = assignSelection[card.id];
                                if (!selectedTeacherId) {
                                  showToast("Select a teacher first", "error");
                                  return;
                                }
                                showToast("Assigning card...", "info");
                                try {
                                  const nowIso = new Date().toISOString();
                                  await updateDocument('rfid_cards', card.id, {
                                    teacher_id: selectedTeacherId,
                                    assigned_date: nowIso,
                                    updated_at: nowIso,
                                  });
                                  await updateDocument('teachers', selectedTeacherId, { rfid_id: card.rfid_id });
                                  showToast("Card assigned successfully", "success");
                                  setAssignSelection(prev => ({ ...prev, [card.id]: '' }));
                                  fetchData();
                                } catch (error) {
                                  showToast("Failed to assign card", "error");
                                }
                              }}
                            >
                              Assign
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              showToast("Unassigning card...", "info");
                              try {
                                await updateDocument('rfid_cards', card.id, {
                                  teacher_id: null,
                                  assigned_date: null,
                                  updated_at: new Date().toISOString(),
                                });
                                await updateDocument('teachers', card.teacher_id!, { rfid_id: null });
                                showToast("Card unassigned successfully", "success");
                                fetchData();
                              } catch (error) {
                                showToast("Failed to unassign card", "error");
                              }
                            }}
                          >
                            Unassign
                          </Button>
                        )}
                        <Select
                          value={card.status}
                          onChange={(e) => handleStatusChange(card, e.target.value)}
                          className="w-32"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="lost">Lost</option>
                          <option value="damaged">Damaged</option>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(card)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cards found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first RFID card'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Card creation is managed via Teacher creation; manual add disabled */}
    </div>
  );
}