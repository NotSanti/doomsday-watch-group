-- Daily Doomsday countdown is opt-in. Users enable it from Profile.

alter table public.notification_preferences
  alter column daily_countdown set default false;

update public.notification_preferences
set daily_countdown = false
where daily_countdown is distinct from false;
