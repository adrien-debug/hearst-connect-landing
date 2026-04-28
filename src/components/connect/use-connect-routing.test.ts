import { describe, it, expect } from 'vitest'
import { selectionToSearch } from './use-connect-routing'
import { SIMULATION_VIEW_ID, AVAILABLE_VAULTS_VIEW_ID } from './view-ids'

describe('selectionToSearch', () => {
  it('returns an empty search for null selection (clean home URL)', () => {
    expect(selectionToSearch(null)).toBe('')
  })

  it('uses ?view= for the simulation special view', () => {
    expect(selectionToSearch(SIMULATION_VIEW_ID)).toBe(`?view=${SIMULATION_VIEW_ID}`)
  })

  it('uses ?view= for the available-vaults list view', () => {
    expect(selectionToSearch(AVAILABLE_VAULTS_VIEW_ID)).toBe(`?view=${AVAILABLE_VAULTS_VIEW_ID}`)
  })

  it('uses ?vault= for concrete vault ids', () => {
    expect(selectionToSearch('demo-pos-prime-1')).toBe('?vault=demo-pos-prime-1')
  })

  it('encodes ids that contain unsafe characters (defensive)', () => {
    expect(selectionToSearch('vault id with spaces')).toBe('?vault=vault%20id%20with%20spaces')
  })
})
