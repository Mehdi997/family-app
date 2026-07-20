const { pool } = require('../config/database');

const getVehicles = async (req, res) => {
  try {
    const [vehicles] = await pool.query('SELECT * FROM vehicles WHERE family_id = ? ORDER BY brand', [req.user.family_id]);
    for (const v of vehicles) {
      const [lastOil] = await pool.query('SELECT * FROM oil_changes WHERE vehicle_id = ? ORDER BY date DESC LIMIT 1', [v.id]);
      v.lastOilChange = lastOil[0] || null;
      if (v.lastOilChange) {
        v.nextOilChangeMileage = v.lastOilChange.mileage + v.oil_change_interval;
        v.remainingKm = v.nextOilChangeMileage - v.current_mileage;
      } else {
        v.nextOilChangeMileage = v.oil_change_interval;
        v.remainingKm = v.oil_change_interval - v.current_mileage;
      }
      const [insurance] = await pool.query('SELECT * FROM vehicle_insurance WHERE vehicle_id = ? AND end_date >= CURRENT_DATE ORDER BY end_date DESC LIMIT 1', [v.id]);
      v.insurance = insurance[0] || null;
      if (v.insurance) {
        const now = new Date();
        const endDate = new Date(v.insurance.end_date);
        const monthsLeft = Math.max(1, (endDate.getFullYear() - now.getFullYear()) * 12 + (endDate.getMonth() - now.getMonth()));
        v.insurance.monthlySaving = Math.ceil(v.insurance.annual_amount / monthsLeft);
        v.insurance.monthsLeft = monthsLeft;
      }
    }
    res.json({ vehicles });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const createVehicle = async (req, res) => {
  try {
    const { brand, model, year, plate, oilChangeInterval, currentMileage, notes } = req.body;
    const photo = req.file ? `/uploads/vehicles/${req.file.filename}` : null;
    const [result] = await pool.query(
      `INSERT INTO vehicles (family_id, brand, model, year, plate, photo, current_mileage, oil_change_interval, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [req.user.family_id, brand, model, year || null, plate || null, photo, currentMileage || 0, oilChangeInterval || 10000, notes || null]
    );
    res.status(201).json({ message: 'Véhicule ajouté.', id: result[0].id });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const updateVehicle = async (req, res) => {
  try {
    const { brand, model, year, plate, oilChangeInterval, currentMileage, notes } = req.body;
    await pool.query(`UPDATE vehicles SET brand = ?, model = ?, year = ?, plate = ?, current_mileage = ?, oil_change_interval = ?, notes = ? WHERE id = ? AND family_id = ?`,
      [brand, model, year, plate, currentMileage, oilChangeInterval, notes || null, req.params.id, req.user.family_id]);
    res.json({ message: 'Véhicule mis à jour.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const deleteVehicle = async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    res.json({ message: 'Véhicule supprimé.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const addOilChange = async (req, res) => {
  try {
    const { mileage, date, cost, garage, notes } = req.body;
    const invoiceFile = req.file ? `/uploads/invoices/${req.file.filename}` : null;
    await pool.query('INSERT INTO oil_changes (vehicle_id, mileage, date, cost, garage, invoice_file, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.params.id, mileage, date, cost || null, garage || null, invoiceFile, notes || null]);
    await pool.query('UPDATE vehicles SET current_mileage = ? WHERE id = ?', [mileage, req.params.id]);
    res.status(201).json({ message: 'Vidange enregistrée.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const getOilChanges = async (req, res) => {
  try {
    const [changes] = await pool.query('SELECT * FROM oil_changes WHERE vehicle_id = ? ORDER BY date DESC', [req.params.id]);
    res.json({ oilChanges: changes });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const addInsurance = async (req, res) => {
  try {
    const { startDate, endDate, annualAmount, company, policyNumber, notes } = req.body;
    const documentFile = req.file ? `/uploads/insurance/${req.file.filename}` : null;
    await pool.query(`INSERT INTO vehicle_insurance (vehicle_id, start_date, end_date, annual_amount, company, policy_number, document_file, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, startDate, endDate, annualAmount, company || null, policyNumber || null, documentFile, notes || null]);
    res.status(201).json({ message: 'Assurance ajoutée.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const getInsurance = async (req, res) => {
  try {
    const [insurance] = await pool.query('SELECT * FROM vehicle_insurance WHERE vehicle_id = ? ORDER BY end_date DESC', [req.params.id]);
    const enriched = insurance.map(ins => {
      const now = new Date();
      const end = new Date(ins.end_date);
      const monthsLeft = Math.max(1, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()));
      return { ...ins, monthsLeft, monthlySaving: Math.ceil(ins.annual_amount / monthsLeft), isExpired: end < now };
    });
    res.json({ insurance: enriched });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getVehicles, createVehicle, updateVehicle, deleteVehicle, addOilChange, getOilChanges, addInsurance, getInsurance };