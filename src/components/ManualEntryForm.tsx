import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import type { RawStation } from '@/lib/gravityCalculations';

interface Props {
  onAdd: (station: RawStation) => void;
}

const ManualEntryForm = ({ onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RawStation>({
    date: '',
    stationId: '',
    description: '',
    latitude: 0,
    longitude: 0,
    gravimeterReading: 0,
    time: '',
    remark: '',
    height: 0,
  });

  const update = (field: keyof RawStation, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onAdd(form);
    setForm({
      date: '', stationId: '', description: '', latitude: 0,
      longitude: 0, gravimeterReading: 0, time: '', remark: '', height: 0,
    });
    setOpen(false);
  };

  const fields: { key: keyof RawStation; label: string; type: string }[] = [
    { key: 'date', label: 'Date', type: 'text' },
    { key: 'stationId', label: 'Station ID', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'latitude', label: 'Latitude (°)', type: 'number' },
    { key: 'longitude', label: 'Longitude (°)', type: 'number' },
    { key: 'gravimeterReading', label: 'Gravimeter Reading', type: 'number' },
    { key: 'time', label: 'Time (HH:MM)', type: 'text' },
    { key: 'height', label: 'Height (m)', type: 'number' },
    { key: 'remark', label: 'Remark', type: 'text' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Station
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Gravity Station</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key} className={f.key === 'description' ? 'col-span-2' : ''}>
              <Label className="text-xs">{f.label}</Label>
              <Input
                type={f.type}
                value={form[f.key]}
                onChange={e =>
                  update(f.key, f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)
                }
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
        <Button onClick={handleSubmit} className="mt-2 w-full">
          Add Station
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ManualEntryForm;
