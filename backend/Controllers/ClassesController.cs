using Backend.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/classes")]
[Authorize(Roles = "Teacher")]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClassesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClassDto>>> GetClasses()
    {
        var classes = await _context.Classes
            .OrderBy(c => c.Name)
            .Select(c => new ClassDto(c.Id, c.Name))
            .ToListAsync();

        return Ok(classes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClassDto>> GetClass(int id)
    {
        var classEntity = await _context.Classes.FindAsync(id);
        if (classEntity == null)
            return NotFound(new ErrorResponse("Class not found"));

        return Ok(new ClassDto(classEntity.Id, classEntity.Name));
    }
}