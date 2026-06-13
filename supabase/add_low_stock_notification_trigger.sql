-- ==========================================
-- Trigger: Peringatan Stok Material Menipis
-- ==========================================

CREATE OR REPLACE FUNCTION public.fn_on_material_stock_low()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  admin_rec record;
BEGIN
  -- Cek jika stok turun hingga atau di bawah 15, dan sebelumnya masih di atas 15
  -- (Pengecekan OLD.stock > 15 mencegah spam notifikasi jika stok terus turun di angka 14, 13, 12, dst)
  IF NEW.stock <= 15 AND OLD.stock > 15 THEN
    
    -- Kirim notifikasi ke semua pengguna dengan role 'admin'
    FOR admin_rec IN 
      SELECT id FROM public.users 
      WHERE role = 'admin' AND is_active = true
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        admin_rec.id,
        'low_stock',
        'Peringatan: Stok Material Menipis',
        E'Perhatian, stok material berikut hampir habis:\n\n' ||
        'Material : ' || NEW.name || E'\n' ||
        'Sisa Stok: ' || NEW.stock || ' ' || NEW.unit || E'\n\n' ||
        'Mohon segera lakukan pengadaan/restock agar tidak menghambat penugasan pemeliharaan di lapangan.',
        NEW.id
      );
    END LOOP;
    
  END IF;

  RETURN NEW;
END;
$$;

-- Hapus trigger lama jika ada agar aman dijalankan ulang
DROP TRIGGER IF EXISTS trg_on_material_stock_low ON public.materials;

-- Pasang trigger pada tabel materials, hanya bereaksi ketika kolom 'stock' di-update
CREATE TRIGGER trg_on_material_stock_low
AFTER UPDATE OF stock ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.fn_on_material_stock_low();
