# Generated by Django 5.2.3 on 2025-07-11 07:46

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0006_alter_inventoryitem_quantity_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="supplier",
            name="gst_number",
            field=models.CharField(
                max_length=15,
                unique=True,
                validators=[
                    django.core.validators.RegexValidator(
                        message="Invalid GST number format. Example: 22AAAAA0000A1Z5",
                        regex="^\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}[A-Z\\d]{1}[Z]{1}[A-Z\\d]{1}$",
                    )
                ],
            ),
        ),
    ]
