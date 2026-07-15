"""
Service layer for grade-related business logic.
Centralizes grade distribution, averages, and computation.
"""
from decimal import Decimal


# Grade threshold constants
GRADE_THRESHOLDS = {
    'outstanding': 90,
    'very_satisfactory': 85,
    'satisfactory': 80,
    'fairly_satisfactory': 75,
}


def get_grade_distribution(queryset):
    """
    Compute grade distribution from a Grade queryset.
    
    Returns dict with counts for each category.
    """
    return {
        'outstanding': queryset.filter(raw_score__gte=90).count(),
        'very_satisfactory': queryset.filter(raw_score__gte=85, raw_score__lt=90).count(),
        'satisfactory': queryset.filter(raw_score__gte=80, raw_score__lt=85).count(),
        'fairly_satisfactory': queryset.filter(raw_score__gte=75, raw_score__lt=80).count(),
        'failed': queryset.filter(raw_score__lt=75).count(),
    }


def compute_gpa(average):
    """
    Compute GPA using DepEd standard scale.
    
    1.00 = 98-100, 1.25 = 95-97, 1.50 = 92-94, 1.75 = 89-91,
    2.00 = 86-88, 2.25 = 83-85, 2.50 = 80-82, 2.75 = 77-79,
    3.00 = 75-76, 5.00 = Below 75
    """
    if average is None:
        return None
    avg = float(average)
    if avg >= 98: return Decimal('1.00')
    if avg >= 95: return Decimal('1.25')
    if avg >= 92: return Decimal('1.50')
    if avg >= 89: return Decimal('1.75')
    if avg >= 86: return Decimal('2.00')
    if avg >= 83: return Decimal('2.25')
    if avg >= 80: return Decimal('2.50')
    if avg >= 77: return Decimal('2.75')
    if avg >= 75: return Decimal('3.00')
    return Decimal('5.00')


def get_remarks(raw_score, passing_grade=75.0):
    """
    Compute descriptive remarks from raw score.
    """
    if raw_score is None:
        return "No Grade"
    if raw_score >= 90:
        return "Outstanding"
    if raw_score >= 85:
        return "Very Satisfactory"
    if raw_score >= 80:
        return "Satisfactory"
    if raw_score >= passing_grade:
        return "Fairly Satisfactory"
    return "Did Not Meet Expectations"


def get_descriptive_equivalent(average, passing_grade=75.0):
    """
    Get descriptive equivalent from general average.
    """
    if average is None:
        return "No Grades"
    if average >= 90:
        return "Outstanding"
    if average >= 85:
        return "Very Satisfactory"
    if average >= 80:
        return "Satisfactory"
    if average >= passing_grade:
        return "Fairly Satisfactory"
    return "Did Not Meet Expectations"


def calculate_general_average(q1, q2, q3, q4):
    """
    Calculate general average from quarterly grades.
    Returns rounded integer average or None.
    """
    quarters = [q1, q2, q3, q4]
    valid = [q for q in quarters if q is not None]
    if valid:
        return round(sum(valid) / len(valid))
    return None
