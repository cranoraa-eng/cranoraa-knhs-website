from django.db import models

from .user import User


class ScratchCard(models.Model):
    serial_number = models.CharField(max_length=12, unique=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scratch_cards')
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.serial_number} - {self.student.username}"

    def save(self, *args, **kwargs):
        if not self.serial_number:
            self.serial_number = self.generate_serial()
        super().save(*args, **kwargs)

    def generate_serial(self):
        import secrets
        return f"{secrets.randbelow(10**12):012d}"


class Fee(models.Model):
    FEE_TYPE_CHOICES = [
        ('tuition', 'Tuition Fee'),
        ('miscellaneous', 'Miscellaneous Fee'),
        ('books', 'Books/Materials'),
        ('uniform', 'Uniform'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fees')
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date', '-created_at']

    def __str__(self):
        return f"{self.student.username} - {self.get_fee_type_display()} - {self.amount}"

    def balance(self):
        return self.amount - self.amount_paid

    def save(self, *args, **kwargs):
        if self.amount_paid >= self.amount:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        else:
            self.status = 'unpaid'
        super().save(*args, **kwargs)
