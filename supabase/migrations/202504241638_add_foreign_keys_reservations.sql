-- Ajoute la clé étrangère entre reservations.court_id et courts.id
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_court
FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE;

-- Ajoute la clé étrangère entre reservations.user_id et profiles.id
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_user
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
