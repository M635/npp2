use memmap2::Mmap;
use std::fs::File;
use std::io::{self, Read, Seek};

const DEFAULT_CHUNK_SIZE: usize = 8 * 1024 * 1024;

pub struct ChunkReader {
    path: String,
    file_size: u64,
    chunk_size: usize,
    total_chunks: u64,
}

impl ChunkReader {
    pub fn new(path: &str, chunk_size: Option<usize>) -> io::Result<Self> {
        let metadata = std::fs::metadata(path)?;
        let file_size = metadata.len();
        let chunk_size = chunk_size.unwrap_or(DEFAULT_CHUNK_SIZE);
        let total_chunks = if file_size == 0 { 1 } else { (file_size as usize).div_ceil(chunk_size) as u64 };

        Ok(Self { path: path.to_string(), file_size, chunk_size, total_chunks })
    }

    pub fn file_size(&self) -> u64 { self.file_size }
    pub fn total_chunks(&self) -> u64 { self.total_chunks }

    pub fn read_chunk(&self, chunk_index: u64) -> io::Result<Vec<u8>> {
        let start = chunk_index as usize * self.chunk_size;
        if start as u64 >= self.file_size { return Ok(Vec::new()); }
        let end = std::cmp::min(start + self.chunk_size, self.file_size as usize);
        let length = end - start;

        let file = File::open(&self.path)?;
        let mmap = unsafe { Mmap::map(&file)? };
        Ok(mmap[start..end].to_vec())
    }

    pub fn read_range(&self, start: u64, length: usize) -> io::Result<Vec<u8>> {
        if start >= self.file_size { return Ok(Vec::new()); }
        let end = std::cmp::min(start as usize + length, self.file_size as usize);
        let file = File::open(&self.path)?;
        let mmap = unsafe { Mmap::map(&file)? };
        Ok(mmap[start as usize..end].to_vec())
    }

    pub fn read_tail(&self, tail_bytes: u64) -> io::Result<Vec<u8>> {
        if self.file_size <= tail_bytes { return self.read_chunk(0); }
        let start = self.file_size - tail_bytes;
        self.read_range(start, tail_bytes as usize)
    }

    pub fn count_lines(&self) -> io::Result<u64> {
        let file = File::open(&self.path)?;
        let mmap = unsafe { Mmap::map(&file)? };
        let count = mmap.iter().filter(|&&b| b == b'\n').count() as u64;
        Ok(count + 1)
    }

    pub fn read_line_at(&self, target_line: u64) -> io::Result<(u64, String)> {
        let file = File::open(&self.path)?;
        let mmap = unsafe { Mmap::map(&file)? };
        let mut current_line = 0u64;
        let mut last_pos = 0usize;

        for (i, &b) in mmap.iter().enumerate() {
            if b == b'\n' {
                current_line += 1;
                if current_line == target_line {
                    return Ok((current_line, String::from_utf8_lossy(&mmap[last_pos..i]).into_owned()));
                }
                last_pos = i + 1;
            }
        }
        if current_line + 1 == target_line && last_pos < mmap.len() {
            return Ok((current_line + 1, String::from_utf8_lossy(&mmap[last_pos..]).into_owned()));
        }
        Ok((0, String::new()))
    }
}

pub fn read_file_content(path: &str) -> io::Result<Vec<u8>> { std::fs::read(path) }
pub fn get_file_size(path: &str) -> io::Result<u64> { Ok(std::fs::metadata(path)?.len()) }
pub fn path_exists(path: &str) -> bool { std::path::Path::new(path).exists() }
