from django.db import migrations, models


def set_all_admin(apps, schema_editor):
    User = apps.get_model('core', 'User')
    User.objects.all().update(role='admin', is_staff=True)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_chauffeur_user_alter_user_role_auditlog'),
    ]

    operations = [
        migrations.RunPython(set_all_admin, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('admin', 'Administrateur')],
                default='admin',
                max_length=20,
            ),
        ),
    ]
