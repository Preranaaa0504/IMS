# Generated by Django 5.2.3 on 2025-07-10 11:44

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0002_inventoryitem_created_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="inventoryitem",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
