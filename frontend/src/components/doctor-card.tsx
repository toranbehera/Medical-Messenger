import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Doctor } from '@/types/doctor';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <div className="font-semibold text-lg">{doctor.name}</div>
        <div className="text-sm text-gray-500">{doctor.specialty}</div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-700 space-y-1">
          <div>Email: {doctor.email}</div>
          <div>Phone: {doctor.phone}</div>
          <div>Experience: {doctor.experience} years</div>
          <div>Rating: {doctor.rating}</div>
          <div className="text-gray-600">{doctor.bio}</div>
          <div className="text-gray-500">
            Availability: {doctor.availability}
          </div>
        </div>
        <Button
          className="mt-5"
          onClick={() => router.push(`/doctors/${doctor.id}`)}
        >
          Subscribe
        </Button>
      </CardContent>
    </Card>
  );
}
