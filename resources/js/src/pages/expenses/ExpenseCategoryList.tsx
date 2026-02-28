import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import {
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    ExpenseCategory,
} from '../../services/expenseCategoryService';

const DEFAULT_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#6b7280', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const ExpenseCategoryList = () => {
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
    const [formData, setFormData] = useState({ name: '', color: '#6b7280' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await getExpenseCategories();
            setCategories(response.data);
        } catch {
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({ name: '', color: DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length] });
        setShowModal(true);
    };

    const openEditModal = (category: ExpenseCategory) => {
        setEditingCategory(category);
        setFormData({ name: category.name, color: category.color });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setSubmitting(true);
        try {
            if (editingCategory) {
                await updateExpenseCategory(editingCategory.id, formData);
                toast.success('Category updated successfully');
            } else {
                await createExpenseCategory(formData);
                toast.success('Category created successfully');
            }
            setShowModal(false);
            fetchCategories();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to save category';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (category: ExpenseCategory) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete category "${category.name}"? This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });
        if (result.isConfirmed) {
            try {
                await deleteExpenseCategory(category.id);
                toast.success('Category deleted successfully');
                fetchCategories();
            } catch {
                toast.error('Failed to delete category');
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <PageHeader
                title="Expense Categories"
                breadcrumbs={[
                    { label: 'Dashboard', path: '/' },
                    { label: 'Expense Categories' },
                ]}
                action={
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        Add Category
                    </button>
                }
            />

            <div className="panel">
                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Color</th>
                                <th>Name</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-4 text-gray-500">
                                        No categories found. Click "Add Category" to create one.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id}>
                                        <td>
                                            <span
                                                className="inline-block w-6 h-6 rounded-full border"
                                                style={{ backgroundColor: category.color }}
                                            />
                                        </td>
                                        <td className="font-semibold">{category.name}</td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => openEditModal(category)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(category)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto flex items-start justify-center pt-20">
                    <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-md my-8 animate__animated animate__fadeInDown">
                        <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                            <h5 className="font-bold text-lg">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h5>
                            <button type="button" className="text-white-dark hover:text-dark" onClick={() => setShowModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="p-5">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="label">
                                        Category Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter category name"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="color" className="label">
                                        Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="color"
                                            type="color"
                                            className="form-input w-14 h-10 p-1 cursor-pointer"
                                            value={formData.color}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                                        />
                                        <div className="flex gap-2 flex-wrap">
                                            {DEFAULT_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`w-7 h-7 rounded-full border-2 ${formData.color === color ? 'border-primary scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" className="btn btn-outline-danger" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseCategoryList;
