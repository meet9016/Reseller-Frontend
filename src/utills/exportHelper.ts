import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import toast from 'react-hot-toast';

export interface ExportColumn {
  header: string;
  key: string;
  width: number;
}

export async function exportToExcel(
  fileName: string,
  sheetName: string,
  columns: ExportColumn[],
  data: any[]
) {
  try {
    const token = getAuthToken();
    const res = await axios.post(
      baseUrl.exportGeneric,
      { fileName, sheetName, columns, data },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export Error:', error);
    toast.error('Failed to export data');
  }
}
