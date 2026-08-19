-- Editorial era labels for watchlist section headers.
alter table public.titles add column if not exists era text;

update public.titles set era = 'Phase 1 — The Avengers Initiative (2008–2012)' where name in ('Iron Man', 'The Incredible Hulk', 'Iron Man 2', 'Thor', 'The Avengers');

update public.titles set era = 'Legacy: WWII & The 1940s' where name in ('Captain America: The First Avenger', 'Marvel One-Shot: Agent Carter', 'Agent Carter', 'Agent Carter (Season 2)');

update public.titles set era = 'Phase 2 — HYDRA & The Infinity Stones (2012–2015)' where name in ('Iron Man 3', 'Thor: The Dark World', 'Captain America: The Winter Soldier', 'Guardians of the Galaxy', 'Guardians of the Galaxy Vol. 2');

update public.titles set era = 'Phase 3A — Street Level Heroes (2015–2016)' where name in ('Avengers: Age of Ultron', 'Ant-Man');

update public.titles set era = 'Phase 3B — Civil War & Fallout (2016–2018)' where name in ('Captain America: Civil War', 'Doctor Strange', 'Spider-Man: Homecoming', 'Black Panther', 'Black Widow', 'Team Thor', 'Team Thor: Part 2', 'Deadpool', 'Deadpool 2');

update public.titles set era = 'Phase 3C — Ragnarok & The Infinity War (2018)' where name in ('Thor: Ragnarok', 'Avengers: Infinity War', 'Ant-Man and the Wasp', 'Team Darryl');

update public.titles set era = 'Legacy: 1990s' where name in ('Captain Marvel');

update public.titles set era = 'Phase 4 — The Blip & New Beginnings (2023)' where name in ('Avengers: Endgame', 'Spider-Man: Far From Home', 'WandaVision', 'The Falcon and the Winter Soldier', 'Loki', 'What If...?', 'Shang-Chi and the Legend of the Ten Rings');

update public.titles set era = 'Phase 4 — Multiverse Opens (2024–2025)' where name in ('Eternals', 'Spider-Man: No Way Home', 'Doctor Strange in the Multiverse of Madness', 'Thor: Love and Thunder', 'Werewolf by Night', 'Black Panther: Wakanda Forever', 'The Guardians of the Galaxy Holiday Special', 'Ant-Man and the Wasp: Quantumania', 'Guardians of the Galaxy Vol. 3', 'The Marvels', 'Moon Knight', 'Secret Invasion', 'Hawkeye', 'Ms. Marvel', 'Marvel Zombies');

update public.titles set era = 'Phase 5 — The Multiverse War (2025–2026)' where name in ('Deadpool & Wolverine', 'Captain America: Brave New World', 'Thunderbolts*', 'Loki (Season 2)');

update public.titles set era = 'Phase 6 — Doomsday (2026)' where name in ('The Fantastic Four: First Steps', 'Avengers: Doomsday', 'Spider-Man: Brand New Day');

update public.titles set era = 'Legacy: The Fox X-Men Saga' where name in ('X-Men: First Class', 'X-Men', 'X2: X-Men United', 'X-Men: The Last Stand', 'The Wolverine', 'X-Men: Days of Future Past', 'X-Men: Apocalypse', 'Dark Phoenix');

update public.titles set era = 'Legacy: Future (2029)' where name in ('Logan');
