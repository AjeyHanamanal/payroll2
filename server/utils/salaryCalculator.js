const moment = require('moment');
const IncrementSettings = require('../models/IncrementSettings');

class SalaryCalculator {
  // Calculate current salary with increments
  static async calculateCurrentSalary(employee) {
    const incrementSettings = await IncrementSettings.findOne({ isActive: true });
    if (!incrementSettings) {
      return employee.baseSalary;
    }

    const joiningDate = moment(employee.dateOfJoining);
    const currentDate = moment();
    const yearsOfService = currentDate.diff(joiningDate, 'years');
    
    if (yearsOfService < incrementSettings.interval) {
      return employee.baseSalary;
    }

    const numberOfIncrements = Math.floor(yearsOfService / incrementSettings.interval);
    let currentSalary = employee.baseSalary;

    for (let i = 0; i < numberOfIncrements; i++) {
      if (incrementSettings.incrementType === 'percentage') {
        currentSalary += (currentSalary * incrementSettings.incrementValue / 100);
      } else {
        currentSalary += incrementSettings.incrementValue;
      }
    }

    return Math.round(currentSalary);
  }

  // Calculate monthly salary breakdown
  static calculateMonthlySalary(employee, month, year, leaves = []) {
    const basicSalary = employee.currentSalary;
    
    // Calculate allowances (example percentages)
    const hra = basicSalary * 0.4; // 40% of basic
    const da = basicSalary * 0.5;  // 50% of basic
    const ta = 2000; // Fixed transport allowance
    const otherAllowances = 1000; // Fixed other allowances

    const allowances = {
      hra,
      da,
      ta,
      other: otherAllowances
    };

    // Calculate bonuses (example)
    const performanceBonus = basicSalary * 0.1; // 10% performance bonus
    const attendanceBonus = 500; // Fixed attendance bonus
    const otherBonuses = 0;

    const bonuses = {
      performance: performanceBonus,
      attendance: attendanceBonus,
      other: otherBonuses
    };

    // Calculate deductions
    const tax = basicSalary * 0.1; // 10% tax
    const pf = basicSalary * 0.12; // 12% PF
    const esi = basicSalary * 0.0175; // 1.75% ESI
    const loanDeduction = 0; // Can be set per employee
    const otherDeductions = 0;

    // Calculate leave-based deductions
    const unpaidLeaves = this.calculateUnpaidLeaves(leaves, month, year);
    const perDaySalary = basicSalary / 30; // Assuming 30 days per month
    const leaveDeduction = unpaidLeaves * perDaySalary;

    const deductions = {
      tax,
      pf,
      esi,
      loan: loanDeduction,
      leave: leaveDeduction,
      other: otherDeductions
    };

    // Calculate totals
    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
    const totalBonuses = Object.values(bonuses).reduce((sum, val) => sum + val, 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);

    const grossSalary = basicSalary + totalAllowances + totalBonuses;
    const netSalary = grossSalary - totalDeductions;

    return {
      basicSalary,
      allowances,
      bonuses,
      deductions,
      grossSalary: Math.round(grossSalary),
      netSalary: Math.round(netSalary),
      workingDays: 30 - unpaidLeaves,
      paidLeaves: this.calculatePaidLeaves(leaves, month, year),
      unpaidLeaves
    };
  }

  // Calculate unpaid leaves for a specific month
  static calculateUnpaidLeaves(leaves, month, year) {
    return leaves
      .filter(leave => {
        const leaveMonth = moment(leave.startDate).month() + 1;
        const leaveYear = moment(leave.startDate).year();
        return leaveMonth === month && leaveYear === year && !leave.isPaid;
      })
      .reduce((total, leave) => total + leave.numberOfDays, 0);
  }

  // Calculate paid leaves for a specific month
  static calculatePaidLeaves(leaves, month, year) {
    return leaves
      .filter(leave => {
        const leaveMonth = moment(leave.startDate).month() + 1;
        const leaveYear = moment(leave.startDate).year();
        return leaveMonth === month && leaveYear === year && leave.isPaid;
      })
      .reduce((total, leave) => total + leave.numberOfDays, 0);
  }

  // Apply increments to all employees
  static async applyIncrements() {
    const incrementSettings = await IncrementSettings.findOne({ isActive: true });
    if (!incrementSettings) {
      return { message: 'No active increment settings found' };
    }

    const Employee = require('../models/Employee');
    const employees = await Employee.find({ status: 'active' });
    let updatedCount = 0;

    for (const employee of employees) {
      const newSalary = await this.calculateCurrentSalary(employee);
      if (newSalary !== employee.currentSalary) {
        employee.currentSalary = newSalary;
        await employee.save();
        updatedCount++;
      }
    }

    return { 
      message: `Increments applied to ${updatedCount} employees`,
      updatedCount 
    };
  }
}

module.exports = SalaryCalculator; 